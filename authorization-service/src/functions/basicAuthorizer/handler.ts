import { APIGatewayTokenAuthorizerEvent, APIGatewayAuthorizerResult } from 'aws-lambda';
import * as dotenv from 'dotenv';

dotenv.config();

export const basicAuthorizer = async (event: APIGatewayTokenAuthorizerEvent): Promise<APIGatewayAuthorizerResult> => {
  console.log('Event: ', JSON.stringify(event));

  try {
    // Check if Authorization header exists
    if (!event.authorizationToken) {
      return generatePolicy('user', 'Deny', event.methodArn);
    }

    // Extract credentials from Basic Auth header
    const authorizationHeader = event.authorizationToken;
    const encodedCreds = authorizationHeader.split(' ')[1];
    const buff = Buffer.from(encodedCreds, 'base64');
    console.log(buff);
    
    const plainCreds = buff.toString('utf-8').split(':');
    const username = plainCreds[0];
    const password = plainCreds[1];

    console.log('username:', username);
    console.log('password:', password);

    // Get stored credentials from environment variables
    const storedPassword = process.env[username];
    console.log('storedPassword:', storedPassword);

    const effect = (!storedPassword || storedPassword !== password) ? 'Deny' : 'Allow';
    
    // Generate policy
    return generatePolicy('user', effect, event.methodArn);

  } catch (error) {
    console.log('Error:', error);
    return generatePolicy('user', 'Deny', event.methodArn);
  }
};

const generatePolicy = (
  principalId: string,
  effect: 'Allow' | 'Deny',
  resource: string
): APIGatewayAuthorizerResult => {
  return {
    principalId: principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource
        }
      ]
    }
  };
};
