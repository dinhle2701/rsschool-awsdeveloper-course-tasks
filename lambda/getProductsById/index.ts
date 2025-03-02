import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand
} from "@aws-sdk/lib-dynamodb";

import {Product, ProductWithStock} from "../../types/Products";
import {Stock} from "../../types/Stocks";

const logger = new Logger({
  serviceName: 'productService',
  logLevel: 'INFO'
});

const metrics = new Metrics({
  namespace: 'ProductsApp',
  serviceName: 'productService',
  defaultDimensions: {
    environment: process.env.ENVIRONMENT || 'development'
  }
});

const client = new DynamoDBClient({
  region: process.env.REGION
});
const docClient = DynamoDBDocumentClient.from(client);

const createResponse = (statusCode: number, body: any) => ({
  statusCode,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
  },
  body: JSON.stringify(body)
});

export const handler = async (event: any) => {
  logger.addContext(event);
  const productId = event.pathParameters?.id;

  try {
    logger.info('Getting product by ID', {
      operation: 'getProductById',
      productId
    });
    metrics.addMetric('getProductByIdInvocations', MetricUnit.Count, 1);

    if (!productId) {
      logger.error('Missing product ID');
      metrics.addMetric('missingProductIdErrors', MetricUnit.Count, 1);
      return createResponse(400, { message: 'Missing product ID' });
    }

    // Get product
    const productParams = {
      TableName: process.env.PRODUCTS_TABLE,
      Key: { id: productId }
    };

    const productCommand = new GetCommand(productParams);
    const productResponse = await docClient.send(productCommand);

    if (!productResponse.Item) {
      logger.info('Product not found', { productId });
      metrics.addMetric('productNotFound', MetricUnit.Count, 1);
      return createResponse(404, {
        message: 'Product not found'
      });
    }

    // Get stock
    const stockParams = {
      TableName: process.env.STOCKS_TABLE,
      Key: { product_id: productId }
    };

    const stockCommand = new GetCommand(stockParams);
    const stockResponse = await docClient.send(stockCommand);

    const product = productResponse.Item as Product;
    const stock = stockResponse.Item as Stock;

    const response: ProductWithStock = {
      ...product,
      count: stock?.count || 0
    };

    logger.info('Successfully retrieved product', {
      productId,
      hasStock: !!stock
    });
    metrics.addMetric('successfulProductRetrieval', MetricUnit.Count, 1);

    return createResponse(200, response);

  } catch (error: any) {
    logger.error('Error getting product', {
      productId,
      error: error.message,
      errorName: error.name,
      stackTrace: error.stack
    });
    metrics.addMetric('productRetrievalErrors', MetricUnit.Count, 1);

    return createResponse(500, {
      message: 'Internal server error while fetching product',
      error: process.env.IS_OFFLINE ? error.message : 'Internal server error'
    });
  } finally {
    metrics.publishStoredMetrics();
  }
};
