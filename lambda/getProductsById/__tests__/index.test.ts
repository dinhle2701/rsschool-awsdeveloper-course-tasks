import { APIGatewayProxyEvent } from "aws-lambda";
import { handler } from "../index";
import products from "../../../mock/products";

describe("getProductsById Lambda", () => {
  let mockEvent: APIGatewayProxyEvent;

  beforeEach(() => {
    mockEvent = {
      httpMethod: "GET",
      path: "/products/1",
      headers: {},
      queryStringParameters: null,
      pathParameters: { id: "1" },
      body: null,
      isBase64Encoded: false,
      requestContext: {} as any,
      multiValueHeaders: {},
      multiValueQueryStringParameters: null,
      stageVariables: null,
      resource: "",
    };
  });

  it("should return specific product when valid ID is provided", async () => {
    const expectedProduct = products.find((p) => p.id === "1");
    const response = await handler(mockEvent);

    expect(response.statusCode).toBe(200);
    expect(response.headers).toEqual({
      "Content-Type": "application/json",
    });
    expect(JSON.parse(response.body)).toEqual(expectedProduct);
  });

  it("should return 400 when product is not found", async () => {
    mockEvent.pathParameters = { id: "nonexistent" };
    const response = await handler(mockEvent);

    expect(response.statusCode).toBe(400);
    expect(response.headers).toEqual({
      "Content-Type": "application/json",
    });
    expect(JSON.parse(response.body)).toEqual({
      message: "Product not found",
    });
  });

  it("should return 400 when no ID is provided", async () => {
    mockEvent.pathParameters = null;
    const response = await handler(mockEvent);

    expect(response.statusCode).toBe(400);
    expect(response.headers).toEqual({
      "Content-Type": "application/json",
    });
    expect(JSON.parse(response.body)).toEqual({
      message: "Product not found",
    });
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
