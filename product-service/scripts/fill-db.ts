import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { Product } from '../src/types/product';
import { Stock } from '../src/types/stock';
import { productsData } from './productsData';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'eu-central-1'
});
const dynamodb = DynamoDBDocumentClient.from(client);

// Table names
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || 'products';
const STOCKS_TABLE = process.env.STOCKS_TABLE || 'stocks';

const args = process.argv.slice(2);
const shouldClearTables = args.includes('--clear');

async function clearTables(): Promise<void> {
  console.log('Clearing existing data from tables...');
  
  try {
    const productsResult = await dynamodb.send(new ScanCommand({
      TableName: PRODUCTS_TABLE,
      AttributesToGet: ['id']
    }));
    
    if (productsResult.Items && productsResult.Items.length > 0) {
      console.log(`Deleting ${productsResult.Items.length} products...`);
      
      for (const item of productsResult.Items) {
        await dynamodb.send(new DeleteCommand({
          TableName: PRODUCTS_TABLE,
          Key: { id: item.id }
        }));
      }
    }
    
    const stocksResult = await dynamodb.send(new ScanCommand({
      TableName: STOCKS_TABLE,
      AttributesToGet: ['product_id']
    }));
    
    if (stocksResult.Items && stocksResult.Items.length > 0) {
      console.log(`Deleting ${stocksResult.Items.length} stocks...`);
      
      for (const item of stocksResult.Items) {
        await dynamodb.send(new DeleteCommand({
          TableName: STOCKS_TABLE,
          Key: { product_id: item.product_id }
        }));
      }
    }
    
    console.log('Tables cleared successfully.');
  } catch (error) {
    console.error('Error clearing tables:', error);
    throw error;
  }
}

async function populateTables(): Promise<void> {
  try {
    if (shouldClearTables) {
      await clearTables();
    }
    
    console.log('Populating tables with test data...');
    
    const products: Product[] = [];
    const stocks: Stock[] = [];
    
    for (const productData of productsData) {
      const id = uuidv4();
      
      products.push({ id, ...productData });
      
      // Create stock with random count between 1 and 10
      stocks.push({
        product_id: id,
        count: Math.floor(Math.random() * 10) + 1
      });
    }
    
    console.log(`Adding ${products.length} products...`);
    for (const product of products) {
      await dynamodb.send(new PutCommand({
        TableName: PRODUCTS_TABLE,
        Item: product
      }));
      console.log(`Added product: ${product.title} (ID: ${product.id})`);
    }
    
    console.log(`Adding ${stocks.length} stocks...`);
    for (const stock of stocks) {
      await dynamodb.send(new PutCommand({
        TableName: STOCKS_TABLE,
        Item: stock
      }));
      console.log(`Added stock for product ID: ${stock.product_id}, Count: ${stock.count}`);
    }
    
    console.log('Tables populated successfully!');
  } catch (error) {
    console.error('Error populating tables:', error);
    throw error;
  }
}

populateTables()
  .then(() => console.log('Script completed successfully.'))
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
