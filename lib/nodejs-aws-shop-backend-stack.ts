import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

import * as path from "path";

import { Construct } from "constructs";

export class NodejsAwsShopBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const productsTable = new dynamodb.Table(this, 'ProductsTable', {
      tableName: 'products',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,  // Changed to DESTROY for easy cleanup
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 1,    // Minimum possible value
      writeCapacity: 1,   // Minimum possible value
    });

    const stocksTable = new dynamodb.Table(this, 'StocksTable', {
      tableName: 'stocks',
      partitionKey: { name: 'product_id', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 1,
      writeCapacity: 1,
    });

    const api = new apigateway.RestApi(this, "NodejsAwsShopApi", {
      restApiName: "Shop Service",
      description: "This is the Shop API",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
      },
    });

    // Lambda functions
    const getProductsListFunction = new nodejs.NodejsFunction(this, "getProductsList", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      entry: path.join(__dirname, "../lambda/getProductsList/index.ts"),
      environment: {
        PRODUCTS_TABLE: productsTable.tableName,
        STOCKS_TABLE: stocksTable.tableName,
        REGION: cdk.Stack.of(this).region,
        POWERTOOLS_SERVICE_NAME: 'productService',
        POWERTOOLS_METRICS_NAMESPACE: 'ProductsApp',
        LOG_LEVEL: 'INFO',
      }
    });

    const getProductsByIdFunction = new nodejs.NodejsFunction(this, "getProductsById", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      entry: path.join(__dirname, "../lambda/getProductsById/index.ts"),
      environment: {
        PRODUCTS_TABLE: productsTable.tableName,
        STOCKS_TABLE: stocksTable.tableName,
        REGION: cdk.Stack.of(this).region,
      }
    });

    const createProductFunction = new nodejs.NodejsFunction(this, "createProduct", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      entry: path.join(__dirname, "../lambda/createProduct/index.ts"),
      environment: {
        PRODUCTS_TABLE: productsTable.tableName,
        STOCKS_TABLE: stocksTable.tableName,
        REGION: cdk.Stack.of(this).region,
      }
    });

    // Grant permissions to Lambda
    productsTable.grantReadData(getProductsListFunction);
    productsTable.grantReadData(getProductsByIdFunction);
    productsTable.grantWriteData(createProductFunction);

    stocksTable.grantReadData(getProductsListFunction);
    stocksTable.grantReadData(getProductsByIdFunction);
    stocksTable.grantWriteData(createProductFunction);

    const products = api.root.addResource("products");

    products.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getProductsListFunction, {
        proxy: true,
        requestTemplates: {
          "application/json": '{ "statusCode": "200" }',
        },
      }),
    );

    products.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createProductFunction, {
        proxy: true,
      })
    );

    const product = products.addResource("{id}");

    product.addMethod(
      "GET",
      new apigateway.LambdaIntegration(
        new nodejs.NodejsFunction(this, "getProductsByIdGet", {
          runtime: lambda.Runtime.NODEJS_20_X,
          handler: "index.handler",
          entry: path.join(__dirname, "../lambda/getProductsById/index.ts"),
        }),
        {
          proxy: true,
        },
      ),
    );

    // Add API Gateway response (optional)
    api.addGatewayResponse("DefaultError", {
      type: apigateway.ResponseType.DEFAULT_4XX,
      responseHeaders: {
        "Access-Control-Allow-Origin": "'*'",
      },
    });

    // Output the API URL
    new cdk.CfnOutput(this, "ApiUrl", {
      value: api.url,
      description: "API Gateway URL",
    });
  }
}
