import { SQSEvent } from 'aws-lambda';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { catalogBatchProcess } from '../handler';

// Mock AWS SDK clients
const ddbMock = mockClient(DynamoDBDocumentClient);
const snsMock = mockClient(SNSClient);

// Mock environment variables
process.env.PRODUCTS_TABLE = 'products';
process.env.STOCKS_TABLE = 'stocks';
process.env.SNS_TOPIC_ARN = 'test-topic-arn';
process.env.REGION = 'eu-central-1';

describe('catalogBatchProcess', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    ddbMock.reset();
    snsMock.reset();
  });

  it('should process valid SQS messages successfully', async () => {
    // Mock SQS event
    const sqsEvent: SQSEvent = {
      Records: [
        {
          body: JSON.stringify({
            title: 'Test Product',
            description: 'Test Description',
            price: 100,
            count: 10
          }),
          messageId: '1',
          receiptHandle: 'test-receipt',
          attributes: {
            ApproximateReceiveCount: '1',
            SentTimestamp: '1234567890',
            SenderId: 'TESTID',
            ApproximateFirstReceiveTimestamp: '1234567890'
          },
          messageAttributes: {},
          md5OfBody: 'test-md5',
          eventSource: 'aws:sqs',
          eventSourceARN: 'test:arn',
          awsRegion: 'eu-central-1'
        }
      ]
    };

    // Mock DynamoDB responses
    ddbMock
      .on(PutCommand)
      .resolves({});

    // Mock SNS response
    snsMock
      .on(PublishCommand)
      .resolves({});

    // Execute the function
    const result = await catalogBatchProcess(sqsEvent);

    expect(result).toEqual({
        statusCode: 200,
        body: JSON.stringify({
          message: 'Products processed successfully'
        })
      });
  });

  it('should handle invalid message body', async () => {
    const sqsEvent: SQSEvent = {
      Records: [
        {
          body: 'invalid-json',
          messageId: '1',
          receiptHandle: 'test-receipt',
          attributes: {
            ApproximateReceiveCount: '1',
            SentTimestamp: '1234567890',
            SenderId: 'TESTID',
            ApproximateFirstReceiveTimestamp: '1234567890'
          },
          messageAttributes: {},
          md5OfBody: 'test-md5',
          eventSource: 'aws:sqs',
          eventSourceARN: 'test:arn',
          awsRegion: 'eu-central-1'
        }
      ]
    };

    const result = await catalogBatchProcess(sqsEvent);

    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify({
        message: 'Products processed successfully'
      })
    });
  });

  it('should handle missing required fields', async () => {
    const sqsEvent: SQSEvent = {
      Records: [
        {
          body: JSON.stringify({
            description: 'Missing required fields'
          }),
          messageId: '1',
          receiptHandle: 'test-receipt',
          attributes: {
            ApproximateReceiveCount: '1',
            SentTimestamp: '1234567890',
            SenderId: 'TESTID',
            ApproximateFirstReceiveTimestamp: '1234567890'
          },
          messageAttributes: {},
          md5OfBody: 'test-md5',
          eventSource: 'aws:sqs',
          eventSourceARN: 'test:arn',
          awsRegion: 'eu-central-1'
        }
      ]
    };

    const result = await catalogBatchProcess(sqsEvent);

    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify({
        message: 'Products processed successfully'
      })
    });
  });
});
