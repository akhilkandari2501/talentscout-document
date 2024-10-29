/* eslint-disable indent */
import {UpdateItemCommand, DynamoDBClient} from '@aws-sdk/client-dynamodb';
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import {CognitoIdentityClient} from '@aws-sdk/client-cognito-identity';
import {fromCognitoIdentityPool} from '@aws-sdk/credential-provider-cognito-identity';
import * as awsID from '../demo-credentials.js';

const client = new DynamoDBClient({
  region: awsID.REGION,
  credentials: fromCognitoIdentityPool({
    client: new CognitoIdentityClient({region: awsID.REGION}),
    identityPoolId: awsID.COGNITO_IDENTITY_POOL_ID, // IDENTITY_POOL_ID
  }),
});

const table = awsID.CANDIDATE_DDB;

// eslint-disable-next-line import/prefer-default-export
export const main = async (id, answers) => {
  const command = new UpdateItemCommand({
    TableName: table,
    Key: {
      uuid_key: {S: id},
    },
    UpdateExpression: 'set Submitted_Answers = :Answers',
    ExpressionAttributeValues: {
      //":Answers":{ S: answers },
      ':Answers': {L: answers.map(answer => ({S: answer}))},
    },
    ReturnValues: 'ALL_NEW',
  });

  const response = await client.send(command);
  console.log(response);
  return response;
};

export const getq = async(Interview) =>{
  const command = new GetCommand({
    TableName: table,
    Key: {
      uuid_key: Interview,
    },
  });
  const response = await client.send(command);
  const c=response.Item.questions;
  console.log(c)
  return c;
};

