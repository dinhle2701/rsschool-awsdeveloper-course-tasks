import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import products from "../../mock/products.js";

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const productId = event.pathParameters?.id;

    const product = products.find(({ id }) => id == productId);

    return productId && product
      ? {
          statusCode: 200,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(product),
        }
      : {
          statusCode: 400,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: "Product not found" }),
        };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};
