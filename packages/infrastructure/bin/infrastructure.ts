import cdk = require('@aws-cdk/core');
import { BuildStack } from '../lib/build-stack';
import { COVID19DashboardLambdaStack } from '../lib/app-stack';

const app = new cdk.App();

new BuildStack(app, 'COVID19DashboardBuildStack', {
    env: {
        account: "263024578010",
        region: "us-west-2"
    }
});
new COVID19DashboardLambdaStack(app, 'AppStack');

app.synth();
