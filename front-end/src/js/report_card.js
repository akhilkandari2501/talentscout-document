import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";
import * as awsID from '../demo-credentials.js';

const dbclient = new DynamoDBClient({
  region: awsID.REGION,
  credentials: fromCognitoIdentityPool({
    client: new CognitoIdentityClient({ region: awsID.REGION }),
    identityPoolId: awsID.COGNITO_IDENTITY_POOL_ID,
  }),
});

let Interview_ID = new URLSearchParams(window.location.search).get('interview_id');

const run = async (ID, table) => {
  const command = new QueryCommand({
    TableName: table,
    KeyConditionExpression: '#id = :ID',
    ExpressionAttributeNames: {
      '#id': 'interview-id'
    },
    ExpressionAttributeValues: {
      ':ID': ID
    },
  });

  const response = await dbclient.send(command);
  //console.log(response);
  if (!response.Items || response.Items.length === 0) {
    throw new Error("No items found for the given interview ID.");
  }
  const c=response.Items.map(item => ({

    completeness: item['completeness'],
    correctness: item['correctness'],
    corr_score: item['correctness-score'], // Access using brackets
    com_score: item['completeness-score'], // Access using brackets
    score: item['total-score'], // Access using brackets
    url: item['interview-url'] 

    }));
  
    const interview_url=c[0].url;
    const completeness=[];
    const correctness=[];
    const completeness_score=[];
    const correctness_score=[];
    let completeness_sum=0;
    let correctness_sum=0;
    const total_score=[];
    let Final_Score=0;
    for (let i = 0; i < c.length; i++) {
        completeness.push(c[i].completeness);
        correctness.push(c[i].correctness); 
        completeness_score.push(c[i].com_score);
        correctness_score.push(c[i].corr_score);
        completeness_sum+=c[i].com_score;
        correctness_sum+=c[i].corr_score;
        total_score.push(c[i].score);
        Final_Score+=c[i].score;

      }
    console.log(total_score);
    return [completeness,correctness,completeness_sum,correctness_sum,total_score,Final_Score,interview_url,completeness_score,correctness_score]
};

const overall = async (url, ID, table) => {
  console.log(ID)
  const command = new QueryCommand({
    TableName: table,
    KeyConditionExpression: '#url = :url AND #id = :ID',
    ExpressionAttributeNames: {
      '#url': 'interview-url',
      '#id': 'interview-id'
    },
    ExpressionAttributeValues: {
      ':url': url,
      ':ID': ID 
    },
  });

  const response = await dbclient.send(command);
  if (!response.Items || response.Items.length === 0) {
    throw new Error("No items found for the given interview URL and ID.");
  }

  let Final=0;
  const c=response.Items.map(item => ({
      completeness: item.completeness,
      correctness: item.correctness

    }));
  
  const Comm_feed=c[0].completeness;
  const Corr_feed=c[0].correctness;
  //console.log(Comm_feed);
  return [Comm_feed,Corr_feed]
};


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const overall_table= awsID.EVALUATION_DDB;
const dashboard_table=awsID.DASHBOARD_DDB;

const [completeness,correctness,comp_score,corr_score,tot_score,total_score,interview_url,completeness_score,correctness_score]= await run(Interview_ID,overall_table);
const [Comm_feed,Corr_feed]= await overall(interview_url,Interview_ID,dashboard_table);

const overallScore = document.getElementById('overall-score');
//const name=await myFunction();

console.log(Comm_feed);

document.getElementById('Complete').innerHTML = '<p>' + Comm_feed + '</p>';
document.getElementById('Correctness').innerHTML = '<p>' + Corr_feed + '</p>';

// document.getElementById('name').textContent = nameElement;
document.getElementById('test-id').textContent = 'Test ID:'+Interview_ID;

console.log(completeness);
for(let i=0;i<completeness.length;i++){
  document.getElementById('com_q'+(i+1)).textContent=completeness[i];
}

for(let i=0;i<correctness.length;i++){
  document.getElementById('cor_q'+(i+1)).textContent=correctness[i];
}
for(let i=0;i<tot_score.length;i++){
  document.getElementById('score_q'+(i+1)).textContent=(tot_score[i]*3)+'/30';
}
for(let i=0;i<completeness_score.length;i++){
  document.getElementById('com_q'+(i+1)+'_score').textContent=(completeness_score[i]*3);
}

for(let i=0;i<correctness_score.length;i++){
  document.getElementById('cor_q'+(i+1)+'_score').textContent=(correctness_score[i]*3);
}
document.getElementById('Completeness_score').textContent=(comp_score*3)+'/45';
document.getElementById('Correctnes_score').textContent=(corr_score*3)+'/45';


overallScore.textContent = ((total_score*3)+10)+'/90';