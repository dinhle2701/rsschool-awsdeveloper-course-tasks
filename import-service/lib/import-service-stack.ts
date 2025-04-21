import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as path from 'path';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface ImportServiceProps extends cdk.StackProps {
  stage?: string,
  basicAuthorizer: string;
}

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ImportServiceProps) {
    super(scope, id, props);

    // Reference existing S3 bucket
    const bucket = s3.Bucket.fromBucketName(this, 'ImportBucket', 'aws-be-import-service-bucket');

    // Reference the existing authorizer Lambda function
    const authorizerFn = lambda.Function.fromFunctionArn(
      this,
      'BasicAuthorizer',
      props.basicAuthorizer
    );

    // Create API Gateway
    const api = new apigateway.RestApi(this, 'ImportApi', {
      restApiName: 'Import Service',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
      },
    });

    // Create Lambda authorizer
    const authorizer = new apigateway.TokenAuthorizer(this, 'ImportApiAuthorizer', {
      handler: authorizerFn,
      identitySource: apigateway.IdentitySource.header('Authorization'),
      resultsCacheTtl: cdk.Duration.seconds(0)
    });

    // Reference the existing SQS queue
    const catalogItemsQueue = sqs.Queue.fromQueueArn(
      this,
      'CatalogItemsQueue',
      `arn:aws:sqs:eu-central-1:202533518997:catalogItemsQueue`
    );

    // Create policy
    const rootUserPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'sqs:SendMessage',
        'sqs:ReceiveMessage',
        'sqs:DeleteMessage',
        'sqs:GetQueueAttributes',
        'sqs:GetQueueUrl',
        'sqs:ListQueues'
      ],
      resources: [catalogItemsQueue.queueArn],
      principals: [
        new iam.AccountRootPrincipal()
      ]
    });

    // Add the policy to the queue
    catalogItemsQueue.addToResourcePolicy(rootUserPolicy);

    const importProductsFileLambda = new NodejsFunction(this, 'ImportProductsFileFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'importProductsFile',
      entry: path.join(__dirname, '../src/functions/importProductsFile/handler.ts'),
      environment: {
        BUCKET_NAME: bucket.bucketName,
        REGION: this.region,
      },
      bundling: {
        externalModules: [],
        minify: true,
        sourceMap: true,
      },
    });

    const importFileParserFunction = new NodejsFunction(this, 'ImportFileParserFunction', {
      functionName: 'importFileParser',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'importFileParser',
      entry: path.join(__dirname, '../src/functions/importFileParser/handler.ts'),
      environment: {
        BUCKET_NAME: bucket.bucketName,
        REGION: this.region,
      },
      bundling: {
        externalModules: [],
        minify: true,
        sourceMap: true,
      },
    });

    // Grant S3 permissions to the Lambda function
    bucket.grantReadWrite(importProductsFileLambda);
    bucket.grantReadWrite(importFileParserFunction);

    // Grant SQS permissions to Lambda and user
    importFileParserFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['sqs:SendMessage'],
        resources: [catalogItemsQueue.queueArn],
      })
    );

    // Create the /import resource
    const importResource = api.root.addResource('import');
    importResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(importProductsFileLambda, {
        proxy: true,
        integrationResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': "'*'",
            },
          },
        ],
      }),
      {
        authorizer: authorizer,
        authorizationType: apigateway.AuthorizationType.CUSTOM,
        requestParameters: {
          'method.request.querystring.name': true,
        },
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true,
            },
          },
          { 
            statusCode: '401',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true,
            },
          },
          { 
            statusCode: '403',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true,
            },
          },
        ],
      }
    );

    // Add S3 event notification for the 'uploaded' folder
    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(importFileParserFunction),
      { prefix: 'uploaded/' }
    );

    // Output the API URL
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'The URL of the Import API',
    });
  }
}
