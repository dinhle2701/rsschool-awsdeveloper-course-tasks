import { APIGatewayProxyEvent } from "aws-lambda";
import { handler } from "../index";
import products from "../../../mock/products";

describe("getProductsList Lambda", () => {
  let mockEvent: APIGatewayProxyEvent;

  beforeEach(() => {
    mockEvent = {
      httpMethod: "GET",
      path: "/products",
      headers: {},
      queryStringParameters: null,
      pathParameters: null,
      body: null,
      isBase64Encoded: false,
      requestContext: {} as any,
      multiValueHeaders: {},
      multiValueQueryStringParameters: null,
      stageVariables: null,
      resource: "",
    };
  });

  it("should return all products with status 200", async () => {
    const response = await handler(mockEvent);

    expect(response.statusCode).toBe(200);
    expect(response.headers).toEqual({
      "Content-Type": "application/json",
    });
    expect(JSON.parse(response.body)).toEqual(products);
  });

  it("should handle errors and return 500", async () => {
    // Mock products import to simulate error
    jest.mock("../../../mock/products", () => {
      throw new Error("Failed to load products");
    });

    const response = await handler(mockEvent);

    expect(response.statusCode).toBe(500);
    expect(response.headers).toEqual({
      "Content-Type": "application/json",
    });
    expect(JSON.parse(response.body)).toEqual({
      message: "Internal server error",
    });
  });
});
