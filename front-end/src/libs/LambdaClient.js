/* eslint-disable indent */
import { LambdaClient,InvokeCommand } from "@aws-sdk/client-lambda";
import {CognitoIdentityClient} from '@aws-sdk/client-cognito-identity';
import {fromCognitoIdentityPool} from '@aws-sdk/credential-provider-cognito-identity';
import * as awsID from '../demo-credentials.js';

const lambda_Client = new LambdaClient({
    region: awsID.REGION,
    credentials: fromCognitoIdentityPool({
      client: new CognitoIdentityClient({ region: awsID.REGION }),
      identityPoolId: awsID.COGNITO_IDENTITY_POOL_ID,
    }),
  });


// eslint-disable-next-line import/prefer-default-export
export const main = async (parameters) => {
  const command = new InvokeCommand(parameters);

  const response = await lambda_Client.send(command);
  console.log(response);
  return response;
};