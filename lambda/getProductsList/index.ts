import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand
} from "@aws-sdk/lib-dynamodb";

import {Stock} from "../../types/Stocks";
import {Product} from "../../types/Products";

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

interface ProductWithStock extends Product {
  count: number;
}

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

  try {
    logger.info('Getting products list', {
      operation: 'getProductsList'
    });
    metrics.addMetric('getProductsListInvocations', MetricUnit.Count, 1);

    // Get all products
    const productsParams = {
      TableName: process.env.PRODUCTS_TABLE,
    };

    const productsCommand = new ScanCommand(productsParams);
    const productsResponse = await docClient.send(productsCommand);

    if (!productsResponse.Items || productsResponse.Items.length === 0) {
      logger.info('No products found');
      metrics.addMetric('emptyProductsList', MetricUnit.Count, 1);
      return createResponse(200, []);
    }

    // Get all stocks
    const stocksParams = {
      TableName: process.env.STOCKS_TABLE,
    };

    const stocksCommand = new ScanCommand(stocksParams);
    const stocksResponse = await docClient.send(stocksCommand);
    const stocks = stocksResponse.Items as Stock[];

    // Combine products with their stock information
    const products = productsResponse.Items as Product[];
    const productsWithStock: ProductWithStock[] = products.map(product => {
      const stockItem = stocks.find(stock => stock.product_id === product.id);
      return {
        ...product,
        count: stockItem ? stockItem.count : 0
      };
    });

    logger.info('Successfully retrieved products', {
      productCount: productsWithStock.length
    });
    metrics.addMetric('productsReturned', MetricUnit.Count, productsWithStock.length, );

    return createResponse(200, productsWithStock);

  } catch (error: any) {
    logger.error('Error getting products list', {
      error: error.message,
      errorName: error.name,
      stackTrace: error.stack
    });
    metrics.addMetric('productsListErrors', MetricUnit.Count, 1);

    return createResponse(500, {
      message: 'Internal server error while fetching products',
      error: process.env.IS_OFFLINE ? error.message : 'Internal server error'
    });
  } finally {
    metrics.publishStoredMetrics();
  }
};
