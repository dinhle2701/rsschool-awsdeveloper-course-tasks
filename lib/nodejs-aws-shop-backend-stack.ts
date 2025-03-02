import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";

import * as path from "path";

import { Construct } from "constructs";

export class NodejsAwsShopBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const api = new apigateway.RestApi(this, "NodejsAwsShopApi", {
      restApiName: "Shop Service",
      description: "This is the Shop API",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
      },
    });

    const products = api.root.addResource("products");

    products.addMethod(
      "GET",
      new apigateway.LambdaIntegration(
        new nodejs.NodejsFunction(this, "getProductsList", {
          runtime: lambda.Runtime.NODEJS_20_X,
          handler: "index.handler",
          entry: path.join(__dirname, "../lambda/getProductsList/index.ts"),
        }),
        {
          proxy: true,
          // Optional: Configure request/response mapping
          requestTemplates: {
            "application/json": '{ "statusCode": "200" }',
          },
        },
      ),
    );

    // GET /products/{id}
    const product = products.addResource("{id}");
    product.addMethod(
      "GET",
      new apigateway.LambdaIntegration(
        new nodejs.NodejsFunction(this, "getProductsById", {
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
