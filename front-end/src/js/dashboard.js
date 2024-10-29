import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
//import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
import {fromCognitoIdentityPool,} from "@aws-sdk/credential-provider-cognito-identity";
import { LambdaClient,InvokeCommand } from "@aws-sdk/client-lambda"
import * as awsID from '../demo-credentials.js';
const dbclient = new DynamoDBClient({
    region: awsID.REGION,
    credentials: fromCognitoIdentityPool({
      client: new CognitoIdentityClient({ region:awsID.REGION}),
      identityPoolId: awsID.COGNITO_IDENTITY_POOL_ID// IDENTITY_POOL_ID
    }),
  });
const run = async (ID,table) => {
   
    const command = new QueryCommand({
        TableName: table,
        KeyConditionExpression : 'interview-url = :interviewId', 
        ExpressionAttributeValues: {
          ':interviewId': ID
        }
      });
    
      const response = await dbclient.send(command);
      const c=response.Items.map(item => ({
          name: item.candidate,
          Score: item.total-score
        }));
      c.sort((a, b) => b.Score - a.Score);
      const Name=[];
      const total_score=[];
      for (let i = 0; i < 3; i++) {
          Name.push(c[i].name);
          total_score.push(c[i].Score);
  
        }
      //console.log(Name);
      //console.log(total_score);
      return [Name, total_score]
  }



const InterviewURL="https://www.w3schools.com/sql/s//";
run(InterviewURL,"Learderboard");
const [CandidateName,total_score]=await run(InterviewURL,"table name");

console.log(CandidateName);
// document.getElementById('interview_id1').textContent = Interview_id[0];
// document.getElementById('interview_id2').textContent = Interview_id[1];
// document.getElementById('interview_id3').textContent = Interview_id[2];
// document.getElementById('interview_id4').textContent = Interview_id[3];
// document.getElementById('interview_id5').textContent = Interview_id[4];

document.getElementById('can1').textContent = CandidateName[0];
document.getElementById('can2').textContent = CandidateName[1];
document.getElementById('can3').textContent = CandidateName[2];
// document.getElementById('can4').textContent = CandidateName[3];
// document.getElementById('can5').textContent = CandidateName[4];

document.getElementById('score_1').textContent = total_score[0];
document.getElementById('score_2').textContent = total_score[1];
document.getElementById('score_3').textContent = total_score[2];
// document.getElementById('score_4').textContent = total_score[3];
// document.getElementById('score_5').textContent = total_score[4];






