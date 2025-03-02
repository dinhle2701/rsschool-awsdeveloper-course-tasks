import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
	DynamoDBDocumentClient,
	TransactWriteCommand,
	TransactWriteCommandInput
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from 'uuid';

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

interface ProductRequest {
	title: string;
	description: string;
	price: number;
	count: number;
}

interface Product {
	id: string;
	title: string;
	description: string;
	price: number;
}

interface Stock {
	product_id: string;
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

const validateProduct = (product: ProductRequest): string[] => {
	const errors: string[] = [];

	if (!product.title?.trim()) errors.push('Title is required');
	if (!product.description?.trim()) errors.push('Description is required');
	if (typeof product.price !== 'number' || product.price <= 0) errors.push('Price must be a positive number');
	if (typeof product.count !== 'number' || product.count < 0) errors.push('Count must be a non-negative number');

	return errors;
};

export const handler = async (event: any) => {
	logger.addContext(event);
	const startTime = Date.now();

	try {
		logger.info('Creating new product', {
			operation: 'createProduct'
		});
		metrics.addMetric('createProductInvocations', MetricUnit.Count, 1);

		let productData: ProductRequest;
		try {
			productData = JSON.parse(event.body);
		} catch (e) {
			logger.error('Invalid JSON in request body');
			metrics.addMetric('invalidJsonErrors', MetricUnit.Count, 1);
			return createResponse(400, {
				message: 'Invalid JSON in request body'
			});
		}

		// Validate input
		const validationErrors = validateProduct(productData);
		if (validationErrors.length > 0) {
			logger.error('Validation failed', { errors: validationErrors });
			metrics.addMetric('validationErrors', MetricUnit.Count, 1);
			return createResponse(400, {
				message: 'Validation failed',
				errors: validationErrors
			});
		}

		const productId = uuidv4();
		logger.info('Generated new product ID', { productId });

		const { title, description, price, count } = productData;

		// Prepare the product and stock items
		const productItem: Product = {
			id: productId,
			title,
			description,
			price,
		};

		const stockItem: Stock = {
			product_id: productId,
			count,
		};

		// Create TransactWriteCommand input
		const transactParams: TransactWriteCommandInput = {
			TransactItems: [
				{
					Put: {
						TableName: process.env.PRODUCTS_TABLE!,
						Item: productItem,
						// Ensure the product doesn't already exist
						ConditionExpression: 'attribute_not_exists(id)',
					}
				},
				{
					Put: {
						TableName: process.env.STOCKS_TABLE!,
						Item: stockItem,
						// Ensure the stock doesn't already exist
						ConditionExpression: 'attribute_not_exists(product_id)',
					}
				}
			]
		};

		try {
			const command = new TransactWriteCommand(transactParams);
			await docClient.send(command);

			logger.info('Product and stock created successfully', {
				productId,
				title,
				executionTime: Date.now() - startTime
			});

			metrics.addMetric('productsCreated', MetricUnit.Count, 1);
			metrics.addMetric('createProductLatency', MetricUnit.Milliseconds, Date.now() - startTime,);

			return createResponse(201, {
				message: 'Product created successfully',
				product: {
					...productItem,
					count: stockItem.count
				}
			});

		} catch (transactionError: any) {
			logger.error('Transaction failed', {
				error: transactionError.message,
				errorName: transactionError.name,
				stackTrace: transactionError.stack
			});

			if (transactionError.name === 'TransactionCanceledException') {
				const cancellationReasons = transactionError.CancellationReasons;
				logger.error('Transaction cancelled', { cancellationReasons });

				metrics.addMetric('transactionCancellations', MetricUnit.Count, 1);

				return createResponse(409, {
					message: 'Failed to create product due to conflict',
					error: process.env.IS_OFFLINE
						? `Transaction cancelled: ${transactionError.message}`
						: 'Transaction failed'
				});
			}

			throw transactionError; // Re-throw for general error handling
		}

	} catch (error: any) {
		logger.error('Error creating product', {
			error: error.message,
			errorName: error.name,
			stackTrace: error.stack,
			executionTime: Date.now() - startTime
		});

		metrics.addMetric('productCreationErrors', MetricUnit.Count, 1);
		metrics.addMetric('createProductLatency', MetricUnit.Milliseconds, Date.now() - startTime);

		return createResponse(500, {
			message: 'Internal server error while creating product',
			error: process.env.IS_OFFLINE ? error.message : 'Internal server error'
		});
	} finally {
		metrics.publishStoredMetrics();
	}
};
