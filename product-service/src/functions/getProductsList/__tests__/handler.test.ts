import { APIGatewayProxyEvent } from 'aws-lambda';
import { getProductsList } from '../handler';

describe('getProductsList', () => {
    it('should return list of products with 200 status code', async () => {
        const event = {} as Partial<APIGatewayProxyEvent> as APIGatewayProxyEvent;

        const result = await getProductsList(event);

        expect(result.statusCode).toBe(200);
        expect(result.headers).toEqual({
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        });

        const body = JSON.parse(result.body);

        expect(Array.isArray(body)).toBe(true);
        expect(body.length).toBeGreaterThan(0);

        body.forEach((product: any) => {
            expect(product).toHaveProperty('id');
            expect(product).toHaveProperty('title');
            expect(product).toHaveProperty('price');
            expect(typeof product.id).toBe('string');
            expect(typeof product.title).toBe('string');
            expect(typeof product.price).toBe('number');
        });
    });
});
