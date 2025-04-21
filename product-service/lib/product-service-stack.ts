import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { FilterOrPolicy } from 'aws-cdk-lib/aws-sns';

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Reference existing DynamoDB tables
    const productsTable = dynamodb.Table.fromTableName(
      this,
      'ExistingProductsTable',
      'products'
    );
    const stocksTable = dynamodb.Table.fromTableName(
      this,
      'ExistingStocksTable',
      'stocks'
    );

    // Create SNS Topic
    const createProductTopic = new sns.Topic(this, 'CreateProductTopic', {
      topicName: 'createProductTopic',
    });

    // Add email subscription
    createProductTopic.addSubscription(
      new subscriptions.EmailSubscription('m.kovel@softteco.com', {
        filterPolicy: {
          price: sns.SubscriptionFilter.numericFilter({
            greaterThanOrEqualTo: 50,
          }),
        },
        json: false,
      })
    );
    createProductTopic.addSubscription(
      new subscriptions.EmailSubscription('waveee@gmail.com', {
        filterPolicy: {
          price: sns.SubscriptionFilter.numericFilter({
            lessThan: 50,
          }),
        },
        json: false,
      })
    );

    // Create SQS Queue
    const catalogItemsQueue = new sqs.Queue(this, 'CatalogItemsQueue', {
      queueName: 'catalogItemsQueue',
    });

    // Define the Lambda function using NodejsFunction
    const getProductsFunction = new NodejsFunction(this, 'GetProductsFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'getProductsList',
      entry: path.join(__dirname, '../src/functions/getProductsList/handler.ts'),
      bundling: {
        externalModules: [],
        minify: true,
        sourceMap: true,
      },
      environment: {
        PRODUCTS_TABLE: productsTable.tableName,
        STOCKS_TABLE: stocksTable.tableName,
      },
    });

    // Add the getProductById function
    const getProductByIdFunction = new NodejsFunction(this, 'GetProductByIdFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'getProductsById',
      entry: path.join(__dirname, '../src/functions/getProductsById/handler.ts'),
      bundling: {
        externalModules: [],
        minify: true,
        sourceMap: true,
      },
      environment: {
        PRODUCTS_TABLE: productsTable.tableName,
        STOCKS_TABLE: stocksTable.tableName,
      },
    });

    // Define the Lambda function for createProduct
    const createProductFunction = new NodejsFunction(this, 'CreateProductFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'createProduct',
      entry: path.join(__dirname, '../src/functions/createProduct/handler.ts'),
      bundling: {
        externalModules: [],
        minify: true,
        sourceMap: true,
      },
      environment: {
        PRODUCTS_TABLE: productsTable.tableName,
        STOCKS_TABLE: stocksTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
    });

    // Create Lambda function
    const catalogBatchProcess = new NodejsFunction(this, 'CatalogBatchProcess', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'catalogBatchProcess',
      entry: path.join(__dirname, '../src/functions/catalogBatchProcess/handler.ts'),
      timeout: cdk.Duration.seconds(30),
      bundling: {
        externalModules: [],
        minify: true,
        sourceMap: true,
      },
      environment: {
        SNS_TOPIC_ARN: createProductTopic.topicArn,
        PRODUCTS_TABLE: productsTable.tableName,
        STOCKS_TABLE: stocksTable.tableName,
      },
    });

    // Add SQS as event source for Lambda
    catalogBatchProcess.addEventSource(new lambdaEventSources.SqsEventSource(catalogItemsQueue, {
      batchSize: 5,
    }));

    // Grant permissions to Lambda functions
    productsTable.grantReadData(getProductsFunction);
    stocksTable.grantReadData(getProductsFunction);
    productsTable.grantReadData(getProductByIdFunction);
    stocksTable.grantReadData(getProductByIdFunction);
    productsTable.grantWriteData(createProductFunction);
    stocksTable.grantWriteData(createProductFunction);
    productsTable.grantWriteData(catalogBatchProcess);
    stocksTable.grantWriteData(catalogBatchProcess);
    createProductTopic.grantPublish(catalogBatchProcess);
    catalogItemsQueue.grantConsumeMessages(catalogBatchProcess);

    // Create API Gateway
    const api = new apigateway.RestApi(this, 'ProductsApi', {
      restApiName: 'Products Service',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key'],
        allowCredentials: true,
      },
    });

    // Create products resource and methods
    const products = api.root.addResource('products');
    products.addMethod('GET', new apigateway.LambdaIntegration(getProductsFunction));
    products.addMethod('POST', new apigateway.LambdaIntegration(createProductFunction));

    const product = products.addResource('{id}');
    product.addMethod('GET', new apigateway.LambdaIntegration(getProductByIdFunction));

    // Output the API Gateway URL
    new cdk.CfnOutput(this, 'ProductsApiEndpoint', {
      value: api.url,
      description: 'The URL of the Products API',
    });
  }
}
