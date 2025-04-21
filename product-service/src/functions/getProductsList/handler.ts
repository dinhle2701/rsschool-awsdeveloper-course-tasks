import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { Product } from '../../types/product';
import { Stock } from '../../types/stock';
import { logger } from '../../utils/powertools';

const client = new DynamoDBClient();
const dynamodb = DynamoDBDocumentClient.from(client);
const productsTable = process.env.PRODUCTS_TABLE || 'products';
const stocksTable = process.env.STOCKS_TABLE || 'stocks';
const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
}

export const getProductsList = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Request received', {
    path: event.path,
    httpMethod: event.httpMethod,
    pathParameters: event.pathParameters,
    queryStringParameters: event.queryStringParameters,
    body: event.body ? JSON.parse(event.body) : null
  });

  try {
    logger.info('Fetching all products');
    const productsResult = await dynamodb.send(new ScanCommand({
      TableName: productsTable,
    }));

    const products: Product[] = productsResult.Items as Product[] || [];
    logger.info('Products fetched', { products });

    logger.info('Fetching all stocks');
    const stocksResult = await dynamodb.send(new ScanCommand({
      TableName: stocksTable,
    }));

    const stocks: Stock[] = stocksResult.Items as Stock[] || [];
    logger.info('Products fetched', { stocks });

    logger.info('Joining products with stocks');
    const joinedProducts = products.map(product => {
      const stock = stocks.find(s => s.product_id === product.id) || { count: 0 };
      const { id, title, description, price, image } = product;
      return {
        id,
        title,
        description,
        price,
        image,
        count: stock.count
      };
    });

    logger.info('Returning joined products', { joinedProducts });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(joinedProducts),
    };
  } catch (error) {
    logger.error('Error fetching products:', { error });
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};
