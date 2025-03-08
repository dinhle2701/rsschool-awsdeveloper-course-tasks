import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { Product } from '../../types/product';
import { Stock } from '../../types/stock';
import { logger } from '../../utils/powertools';

const client = new DynamoDBClient();
const dynamodb = DynamoDBDocumentClient.from(client);
const productsTable = process.env.PRODUCTS_TABLE || 'products';
const stocksTable = process.env.STOCKS_TABLE || 'stocks';
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
}

export const getProductsById = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Request received', {
      path: event.path,
      httpMethod: event.httpMethod,
      pathParameters: event.pathParameters,
      queryStringParameters: event.queryStringParameters,
      body: event.body ? JSON.parse(event.body) : null
    });

  try {
    const productId = event.pathParameters?.id;

    if (!productId) {
      logger.info('Product ID is missing');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Product ID is required' }),
      };
    }

    logger.info('Fetching product:', productId);
    const productResult = await dynamodb.send(new GetCommand({
      TableName: productsTable,
      Key: { id: productId }
    }));

    if (!productResult.Item) {
      logger.info('Product not found:', productId);
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: 'Product not found' }),
      };
    }

    logger.info('Product found:', {product: productResult.Item});
    const { id, title, description, price } = productResult.Item as Product;

    logger.info('Fetching stock:', productId);
    const stockResult = await dynamodb.send(new GetCommand({
      TableName: stocksTable,
      Key: { product_id: productId }
    }));

    logger.info('Stock found:', { stock: stockResult.Item });
    const stock: Stock = stockResult.Item as Stock || { count: 0 };

    // Join product with stock
    const joinedProduct = {
      id,
      title,
      description,
      price,
      count: stock.count
    };
    logger.info('Returning joined product:', joinedProduct);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(joinedProduct),
    };
  } catch (error) {
    logger.error('Error fetching product:', { error });
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Internal server error', error: errorMessage }),
    };
  }
};
