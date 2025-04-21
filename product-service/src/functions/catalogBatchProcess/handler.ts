import { SQSEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { logger } from '../../utils/powertools';
import { v4 as uuidv4 } from 'uuid';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const client = new DynamoDBClient();
const dynamodb = DynamoDBDocumentClient.from(client);
const productsTable = process.env.PRODUCTS_TABLE || 'products';
const stocksTable = process.env.STOCKS_TABLE || 'stocks';
const sns = new SNSClient({ region: 'eu-central-1' });
const topicArn = 'arn:aws:sns:eu-central-1:202533518997:createProductTopic';

export const catalogBatchProcess = async (event: SQSEvent) => {
  try {
    logger.info('Processing SQS messages', { recordCount: event.Records.length });

    for (const record of event.Records) {
      let productData;

      try {
        if (typeof record.body !== 'string') {
          throw new Error('Record body is not a string');
        }

        productData = JSON.parse(record.body);

        if (!productData.title ||
          typeof productData.price !== 'number' ||
          typeof productData.count !== 'number') {
          throw new Error('Invalid product data structure');
        }

        const productId = uuidv4();

        logger.info('Processing product:', { productData, productId });

        // Create product in products table
        await dynamodb.send(new PutCommand({
          TableName: productsTable,
          Item: {
            id: productId,
            title: productData.title,
            description: productData.description || '',
            price: productData.price,
            image: productData.image || ''
          }
        }));

        // Create stock in stocks table
        await dynamodb.send(new PutCommand({
          TableName: stocksTable,
          Item: {
            product_id: productId,
            count: productData.count
          }
        }));

        logger.info('Successfully created product and stock:', { productId: productData.id });

        try {
          await sns.send(new PublishCommand({
            TopicArn: topicArn,
            Message: JSON.stringify({
              message: `Product created: ${productData.title}`,
              product: productData
            }),
            MessageAttributes: {
              price: {
                DataType: 'Number',
                StringValue: productData.price.toString()
              }
            }
          }));
  
          logger.info('SNS notification sent successfully');
  
        } catch (error) {
          logger.error('Error sending SNS notification:', { error });
        }
      } catch (e) {
        logger.error('Error processing individual record:', { error: e, record: record.body });

        continue;
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Products processed successfully' })
    };
  } catch (error) {
    logger.error('Error processing products:', { error });

    // Send error notification to SNS
    await sns.send(new PublishCommand({
      TopicArn: 'arn:aws:sns:eu-central-1:202533518997:createProductTopic',
      Message: JSON.stringify({ error }),
      Subject: 'Error Creating Products',
    }));
    throw error;
  }
};
