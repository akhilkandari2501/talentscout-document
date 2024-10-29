from datetime import datetime
import boto3
import json
import os
import logging

dynamodb = boto3.client('dynamodb')
dynamodb_client = boto3.resource('dynamodb')
TableName1 = os.environ['table_1']
TableName2 = os.environ['table_2']
bedrock_runtime_client = boto3.client(service_name='bedrock-runtime')
table = dynamodb_client.Table(TableName1)
table1 = dynamodb_client.Table(TableName2)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

output_format = {
    "Completeness": "<<YOUR VIEW ON HOW COMPLETE THE CANDIDATES RESPONSE>>",
    "Completeness_Score": "<<YOUR SCORE ON COMPLETENESS OUT OF 5>>",
    "Correctness": "<<YOUR VIEW ON HOW CORRECT THE CANDIDATES RESPONSE>>",
    "Correctness_Score": "<<YOUR SCORE ON CORRECTNESS OUT OF 5>>",
    "Total_Score": "<<SUM OF CORRECTNESS_SCORE AND COMPLETENESS_SCORE OUT OF 10>>"
}

def mock_interview_evaluation(questions, submitted_answers, model_answer, Interview_Id, Interview_url, name, output_format):
    logger.info(f"Starting evaluation for Interview ID: {Interview_Id}")
    
    # Simplified prompt
    template = f"""
    Evaluate the candidate's responses to the following questions:
    Questions: {questions}
    Candidate's Answers: {submitted_answers}
    Model Answers: {model_answer}

    For each question, provide:
    1. Completeness (score 0-5): How thorough was the answer?
    2. Correctness (score 0-5): How accurate was the answer?
    3. Total Score: Sum of Completeness and Correctness

    Respond in the following JSON format:
    {output_format}
    """

    try:
        messages = [
            {
                "role": "user",
                "content": template
            }
        ]
        body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 30000,
            "messages": messages,
            "temperature": 0.1,
            "top_p": 0.9
        })
        modelId = 'anthropic.claude-3-sonnet-20240229-v1:0'
        accept = 'application/json'


        # Validate JSON response
        if not all(key in json_data for key in ['Completeness', 'Completeness_Score', 'Correctness', 'Correctness_Score', 'Total_Score']):
            raise ValueError("AI response missing required fields")

        # Log the evaluation results
        logger.info(f"Evaluation completed for Interview ID: {Interview_Id}")
        logger.info(f"Scores - Completeness: {json_data['Completeness_Score']}, Correctness: {json_data['Correctness_Score']}, Total: {json_data['Total_Score']}")

        # Store results
        update_index(TableName1, Interview_Id, Interview_url, questions, json_data['Completeness'], str(json_data['Completeness_Score']), json_data['Correctness'], str(json_data['Correctness_Score']), str(json_data['Total_Score']))

        return json_data

    except Exception as e:
        logger.error(f"Error in evaluation process: {str(e)}")
        return {"error": str(e)}
        
        
        
def overall_evaluation(input,Interview_Id,Interview_Url,name):
        template =f"""
        As a Digital Literacy Expert, your task is to give a overall feedback based on the {input}.
        Your feedback should encompass three main areas for each of shared questions, i.e.
        1. Completeness   2. Correctness  
        Return Output of evaluation separately for 2 main areas.
        Feedback should start with value of candidates effort and time take to take the interview.
        Feedback should positive and constructive in nature, and not undermine effort taken by candidate.
        Your report should be structured in following JSON format.
        
        Completeness: cumulative completeness feedback from {input}
        Correctness: cumulative correctness feedback from {input}
        
        
        strictly follow the above format , and only fill 2 fields ,Completeness,Correctness.
        Finally, Don't hallucinate and do not include "Based on the provided information, here is the structured feedback report"
        """
        prompt_data = template
        messages = [
                {
                    "role": "user",
                    "content": prompt_data
                }
            ]
        # print(prompt_data)
        body = json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 30000,
        "messages":  messages,
        "temperature": 0.1,
        "top_p": 0.9
        })
        modelId = 'anthropic.claude-3-sonnet-20240229-v1:0'
        accept = 'application/json'
        contentType = 'application/json'
        response = bedrock_runtime_client.invoke_model(body=body, modelId=modelId, accept=accept, contentType=contentType)
        response_body = json.loads(response.get("body").read())
        #res_com = response_body["completion"]
        json_data = json.loads(response_body['content'][0]['text'])
        
        #desired_keys = ['Completeness','Correctness']
        # extracted_values = {}
        # for key in desired_keys:
            
        #     try:
        #         # Attempt to retrieve the value for the current key from json_data
        #         value = json_data[key]
        #         # If the key exists, add it to the extracted_values dictionary with its corresponding value
        #         extracted_values[key] = value
        #     except KeyError:
        #         # Handle the case where the key does not exist in json_data
        #         print(f"Key '{key}' does not exist in json_data")
        #         return ("Something went wrong")
        # print(extracted_values)
        #table1.put_item(Item=extracted_values)
        dynamodb.put_item(
        TableName=TableName2,
        Item={
        'interview-id':{'S': Interview_Id},
        'interview-url': {'S': Interview_Url},
        'completeness':{'S': json_data['Completeness']},
        'correctness':{'S': json_data['Correctness']},
        'name':{'S':name}
        }
        )
        print(json_data)
        return json_data
def get_data(uuid,tableName):
    tableName = tableName
    response = dynamodb.get_item(
        TableName=tableName,
        Key={
            'uuid_key': {'S': uuid},
        }
    )
   

    # Check if the item exists in the response
    if 'Item' in response:
        item = response['Item']
        # Extract the values from the item
        question = item.get('questions', [])
        answer = item.get('model-answers', [])
        submitted_answer=item.get('Submitted_Answers',[])
        name=item.get('candidate-name',[])
        url=item.get('interview-url',[])
        

        return question, answer, submitted_answer,url,name
    else:
        # Item not found
        return ("something went wrong")
def update_index(tableName,Interview_Id,Interview_Url,Question,Completeness,Completeness_Score,Correctness,Correctness_Score,Total_Score):
    response = dynamodb.put_item(
        TableName=tableName,
        Item={
        'interview-id':{'S': Interview_Id},
        'interview-url': {'S': Interview_Url},
        'questions': {'S': Question},
        'completeness':{'S': Completeness},
        'completeness-score':{'N':Completeness_Score},
        'correctness':{'S': Correctness},
        'correctness-score':{'N':Correctness_Score},
        'total-score':{'N':Total_Score}
        }
    )
    return response

def lambda_handler(event, context):
    detailed_report = {}
    primary_key_value=event['uuid']
    questions,model_answer,answer,url,name= get_data(primary_key_value,'jr_candidate_tbl')
    
    #final_result = mock_interview_evaluation(questions["L"][0]["S"], answer["L"][0]["S"], model_answer["L"][0]["S"], primary_key_value, url["S"], name["S"],output_format)
    #ans=final_result['Completeness']
    for i in range(3):
        try:
            final_result = mock_interview_evaluation(questions["L"][i]["S"], answer["L"][i]["S"], model_answer["L"][i]["S"], primary_key_value, url["S"], name["S"],output_format)
            detailed_report[i] = final_result
            
        except Exception as e:
            logging.error(f"Error occurred in iteration {i}: {e}")

    c= overall_evaluation(detailed_report,primary_key_value,url["S"],name["S"])
    
    
    return {"statusCode": 200,"body":f"{c}"}





