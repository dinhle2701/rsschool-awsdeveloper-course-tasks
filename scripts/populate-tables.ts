import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
	DynamoDBDocumentClient,
	BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
	region: "eu-central-1", // replace with your region
});

const docClient = DynamoDBDocumentClient.from(client);

// Test data for products
const productItems = [
	{
		id: "1",
		title: "iPhone 13 Pro",
		description: "Apple iPhone 13 Pro 256GB",
		price: 999.99
	},
	{
		id: "2",
		title: "Samsung Galaxy S21",
		description: "Samsung Galaxy S21 Ultra 5G",
		price: 899.99
	},
	{
		id: "3",
		title: "MacBook Pro",
		description: "MacBook Pro 14-inch M1 Pro",
		price: 1999.99
	},
	{
		id: "4",
		title: "iPad Air",
		description: "iPad Air 4th Generation",
		price: 599.99
	},
	{
		id: "5",
		title: "AirPods Pro",
		description: "Apple AirPods Pro with MagSafe",
		price: 249.99
	}
];

// Test data for stocks
const stockItems = [
	{
		product_id: "1",
		count: 10
	},
	{
		product_id: "2",
		count: 15
	},
	{
		product_id: "3",
		count: 5
	},
	{
		product_id: "4",
		count: 20
	},
	{
		product_id: "5",
		count: 30
	}
];

async function populateTables() {
	try {
		// Populate products table
		const productChunks = chunk(productItems, 25); // DynamoDB limit is 25 items per batch
		for (const chunk of productChunks) {
			const productParams = {
				RequestItems: {
					"products": chunk.map(item => ({
						PutRequest: {
							Item: item
						}
					}))
				}
			};
			await docClient.send(new BatchWriteCommand(productParams));
		}
		console.log("Products table populated successfully");

		// Populate stocks table
		const stockChunks = chunk(stockItems, 25);
		for (const chunk of stockChunks) {
			const stockParams = {
				RequestItems: {
					"stocks": chunk.map(item => ({
						PutRequest: {
							Item: item
						}
					}))
				}
			};
			await docClient.send(new BatchWriteCommand(stockParams));
		}
		console.log("Stocks table populated successfully");

	} catch (error) {
		console.error("Error populating tables:", error);
	}
}

// Utility function to split arrays into chunks
function chunk<T>(array: T[], size: number): T[][] {
	return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
		array.slice(i * size, i * size + size)
	);
}

// Run the population script
populateTables();
