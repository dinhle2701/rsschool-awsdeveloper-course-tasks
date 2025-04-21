import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import * as cdk from 'aws-cdk-lib';

export interface AuthorizationServiceProps {
  stage?: string;
}

export class AuthorizationServiceStack extends cdk.Stack {
  public readonly basicAuthorizer: lambda.Function;

  constructor(scope: Construct, id: string, props: AuthorizationServiceProps = {}) {
    super(scope, id);

    const username = 'MarinaKovel';
    const basicAuthorizer = new NodejsFunction(this, 'BasicAuthorizer', {
      functionName: 'basicAuthorizer',
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../src/functions/basicAuthorizer/handler.ts'),
      handler: 'basicAuthorizer',
      environment: {
        [username]: 'TEST_PASSWORD',
      },
      bundling: {
        externalModules: [],
        minify: true,
        sourceMap: true,
      },
    });
  }
}
