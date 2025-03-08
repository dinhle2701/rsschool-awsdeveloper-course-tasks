import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

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

    // Grant permissions to Lambda functions
    productsTable.grantReadData(getProductsFunction);
    stocksTable.grantReadData(getProductsFunction);
    productsTable.grantReadData(getProductByIdFunction);
    stocksTable.grantReadData(getProductByIdFunction);
    productsTable.grantWriteData(createProductFunction);
    stocksTable.grantWriteData(createProductFunction);

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
