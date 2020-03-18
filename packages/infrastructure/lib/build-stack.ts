import cloudformation = require('@aws-cdk/aws-cloudformation');
import codebuild = require('@aws-cdk/aws-codebuild');
import codecommit = require('@aws-cdk/aws-codecommit');
import codepipeline = require('@aws-cdk/aws-codepipeline');
import iam = require('@aws-cdk/aws-iam');
import cdk = require('@aws-cdk/core');

export class BuildStack extends cdk.Stack {
    constructor(parent: cdk.App, name: string, props?: cdk.StackProps) {
        super(parent, name, props);
        
        const stageRegionMap: {[key: string]: string[]} = {
            gamma: [
                'us-west-2'
            ], 
            prod: [
                'us-east-1'
            ]
        };

        const repo = new codecommit.Repository(this, 'COVID19Dashboard', { repositoryName: 'COVID19Dashboard' });

        const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
        });

        const pipelinePolicy = new iam.PolicyStatement();
        pipelinePolicy.addActions("iam:PassRole");
        pipelinePolicy.addResources("*");
        pipeline.addToRolePolicy(pipelinePolicy);

        const cfnPolicy = new iam.PolicyStatement();
        cfnPolicy.addActions(
            "cloudFormation:Describe*",
            "cloudFormation:Get*",
            "cloudFormation:List*",
            "cloudFormation:Validate*",
            "cloudformation:CreateChangeSet",
            "cloudformation:ExecuteChangeSet",
            "cloudformation:DeleteChangeSet"
        );
        cfnPolicy.addResources("*");
        // Allow the pipeline to execute CFN changes
        pipeline.addToRolePolicy(cfnPolicy);

        const sourceStage = pipeline.addStage({stageName: "source"});
        const source = new codecommit.PipelineSourceAction(sourceStage, 'source', {
            repository: repo,
            branch: 'master',
            stage: sourceStage
        });

        const buildStage = pipeline.addStage({stageName: "build"});
        const project = new codebuild.PipelineProject(this, 'COVID19DashboardBuildProject', {
            environment: {
                buildImage: codebuild.LinuxBuildImage.UBUNTU_14_04_NODEJS_8_11_0
            }
        });
        
        const buildOutput = "BuildOutput";

        const buildAction = new codebuild.PipelineBuildAction(this, 'build', {
            project,
            stage: buildStage,
            inputArtifact: source.outputArtifact,
            outputArtifactName: buildOutput,
        });

        const stackName = 'COVID19DashboardStack';

        Object.keys(stageRegionMap).forEach(stage => {
            const stageSpecificStage = pipeline.addStage({stageName:`Update${stage}`});
            stageRegionMap[stage].forEach(region => {
                const changeSetName = `ChangeSetUpdate-${stage}-${region}`;
                new cloudformation.PipelineCreateReplaceChangeSetAction(this, `MakeChangeSet${stage}-${region}`, {
                    region,
                    stackName,
                    changeSetName,
                    adminPermissions: true,
                    stage: stageSpecificStage,
                    runOrder: 1,
                    templatePath: buildAction.outputArtifact.atPath('infrastructure/build/AppStack.template.yaml'),
                    templateConfiguration: buildAction.outputArtifact.atPath('infrastructure/build/templateConfig.json'),
                });
                new cloudformation.PipelineExecuteChangeSetAction(this, `ExecuteChangeSet${stage}-${region}`, {
                    region,
                    stackName,
                    runOrder: 2,
                    changeSetName,
                    stage: stageSpecificStage
                });
            });
        });

        new cdk.Output(this, "CodeCommitRepoArn", {
            value: repo.repositoryArn,
            disableExport: true,
        });

    }
}
