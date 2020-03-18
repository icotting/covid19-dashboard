import cdk = require('@aws-cdk/core');

import lambda = require('@aws-cdk/aws-lambda');
import apigateway = require('@aws-cdk/aws-apigateway');
import s3 = require('@aws-cdk/aws-s3');

export class COVID19DashboardLambdaStack extends cdk.Stack {
    constructor(parent: cdk.App, name: string, props?: cdk.StackProps) {
        super(parent, name, props);

        const cacheBucket = new s3.Bucket(this, "WebCacheBucket");

        const websiteArtifacts = new cdk.CodebuildWebsiteArtifactConfiguration(this);
        const website = new cdk.StaticWebsite(this, 'Website', {
            website: {
                artifactCopyConfiguration: websiteArtifacts.websiteCopyConfiguration()        
            }
        });

        const lambdaArtifacts = new cdk.CodebuildLambdaArtifactConfiguration(this);

        const requestHandler = new lambda.Function(this, 'COVID19DashboardBackend', {
            handler: "lambda/src/index.handler",
            runtime: lambda.Runtime.NODEJS_12_X,
            code: lambdaArtifacts.code(),
            environment: {
                websiteS3Bucket: website.bucket.bucketName, 
                webCacheBucket: cacheBucket.bucketName
            }
        });
        website.bucket.grantRead(requestHandler.role);
        cacheBucket.grantReadWrite(requestHandler.role);
        
        new apigateway.LambdaRestApi(this, 'COVID19DashboardApi', {
            handler: requestHandler
        });
        
        const cacheJobHandler = new lambda.Function(this, 'COVID19DashboardJob', {
            handler: "lambda/src/job.handler",
            runtime: lambda.Runtime.NODEJS_12_X,
            code: lambdaArtifacts.code(),
            environment: {
                webCacheBucket: cacheBucket.bucketName
            }
        });
        cacheBucket.grantReadWrite(cacheJobHandler.role);
    }
}