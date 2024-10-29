from  datetime import datetime
import boto3
import json
import os

dynamodb = boto3.client('dynamodb')
bedrock_runtime_client = boto3.client(service_name='bedrock-runtime')

def generate_questionnaire(summary_text, name):
    template = """"
    Claude, assume the role of a technical recruiter whose job is to screen candidates. Based on given text from COURSE MATERIAL, generate a customized questionnaire for candidate preparing for job. 
    The questions should focus on the COURSE MATERIAL provided as context, should focus on on identifying candidate's capability to formulate an answer with applied knowledge in real world application. 
    Questions can also focus on candidate's ability to identify alternative approach and advantages and weakness with a particular topic, if applicable. 
    Ensure that the questions are clear, professional, and free from hallucinations. 
    The questionnaire should help us evaluate candidates comprehensively for an interview. All of the questionnaire should contain technical questions based on the context shared as course material.
    Use the candidate's name and details while framing the question. Make the experience as personalised as possible. 
    The tone of the interaction should be active and encouraging. 
    COURSE MATERIAL for the context is shared AS "COURSE MATERIAL" and has been shared in form of text. 
    Do convert and clean shared COURSE MATERIAL into readable and comprehensible statements before using them as context. 
    Also extract maximum 3 core topic, sub-topic from the shared COURSE MATERIAL as overall summary and use it to start the interview context before asking main questions.
    The output should to be python list containing just 3 questions based on the above context. 
    Do not include the title line Here is a sample questionnaire*.
    Output format :[list of just 3 questions generated based on above context]"""

    prompt_data = template+"COURSE MATERIAL:"+summary_text+" Candidate Name: Irshad" 

    messages = [
                {
                    "role": "user",
                    "content": prompt_data
                }
            ]
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
    # print(response_body)
    return(response_body["content"][0]["text"])

def generate_model_answer(summary_text, question_list):
    template = """"
    Claude, assume the role of a smart candidate and expert of the domain. who is sitting in an interview where recruiter is asking 3 questions based on the COURSE MATERIAL shared as context.
    You need to answer each questions focusing on explaining background, explaining concepts and it's real world advantages or application, if relevant.
    You need to formulate answer in speaking format, and try to make answer of atleast 100 words for each question. so don't use bullet points, text diagram etc. while answering back.
    You need to answet each question with completeness for every segment of questions.
    Do explain concepts if needed with simplified real world  analogy to make it comprehensible.
    Do fact check model answer from the shared COURSE MATERIAL and do not hallucinate.
    Make sure answers are clear, professional and free from hallucinations.
    Make sure your answers are atleast of 4 lines.
    Overall each answer provided, showcase candidate capability of conceptual understanding, ability to relate it to real-world problems and able to distinct between alternative approach and clearly state advantages of any approach.
    COURSE MATERIAL for the context is shared AS "COURSE MATERIAL" and has been shared in form of text. 
    question_list has been shared as QUESTION_LIST
    Do not include the title line Here is a sample model answer or similar lines*.
    Generate Output in JSON format like this: [ 'answer for question 1 is here','answer for question 2 is here, 'answer for question 3 is here']
    """

    prompt_data = template+"COURSE MATERIAL:"+summary_text+"\n\n QUESTION_LIST: "+question_list  
    messages = [
            {
                "role": "user",
                "content": prompt_data
            }
        ]

    body = json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 30000,
        "messages":  messages,
        "temperature": 0.1,
        "top_p": 0.9
        })

    model_id = 'anthropic.claude-3-sonnet-20240229-v1:0'
    accept = 'application/json'
    contentType = 'application/json'

    response = bedrock_runtime_client.invoke_model(body=body, modelId=model_id, accept=accept, contentType=contentType)
    response_body = json.loads(response.get("body").read())
    return(response_body["content"][0]["text"])

def update_index(tableName,Interview_Url,Question, Model_Answer,Create_Date, Complexity='Medium',Topic='Java',Sub_Topic='OOPS',Language='English'):
    response = dynamodb.put_item(
        TableName=tableName,
        Item={
        'interview-url': {'S': Interview_Url},
        'question': {'L':[{'S': Question[0]}, {'S': Question[1]}, {'S': Question[2]}]},
        'model-answer': {'L':[{'S': Model_Answer[0]}, {'S': Model_Answer[1]}, {'S': Model_Answer[2]}]},
        'complexity': {'S':Complexity},
        'topic': {'S': Topic},
        'sub-topic': {'S':Sub_Topic},
        'language': {'S':Language},
        'create-date': {'S':Create_Date}
        }
    )
    return response

def get_data(tableName, Interview_Url, Interview_Url_Type):
    response = dynamodb.get_item(
        TableName=tableName,
        Key={
            'interview-url': {'S': Interview_Url},
            'interview-url-type': {'S': Interview_Url_Type}
        }
    )

    # Check if the item exists in the response
    if 'Item' in response:
        item = response['Item']
        # Extract the values from the item
        Interview_Url = item['interview-url']['S']
        Interview_Url_type = item['interview-url-type']['S']
        transcript = item.get('transcript', {}).get('S', '')
        summary = item.get('summary', {}).get('S', '')

        return {
            'interview-url': Interview_Url,
            'interview-url-type': Interview_Url_type,
            'transcript': transcript,
            'summary': summary
        }
    else:
        # Item not found
        return None

def get_summary_from_DDB(input_url, input_url_type):
    table_name = os.environ['transcript_tbl']
    table_output = get_data(table_name, input_url, input_url_type)
    Summary = ''
    if table_output:
        Summary = table_output['summary']
    return Summary

def lambda_handler(event, context):
    name = event['name']
    input_url = event['input_url']
    input_url_type = event['input_url_type']
    tableName = os.environ['questionbank_tbl']

    summary = get_summary_from_DDB(input_url, input_url_type)

    try:
        generated_questions = generate_questionnaire(summary, name)
        model_answers = generate_model_answer(summary, generated_questions)

        list_of_questions = generated_questions.split("\",")
        list_of_questions[0] = list_of_questions[0].replace("[","")
        list_of_questions[-1] = list_of_questions[-1].strip("]")

        list_of_answers = model_answers.split("\",")
        list_of_answers[0] = list_of_answers[0].replace("[","")
        list_of_answers[-1] = list_of_answers[-1].strip("]")

        questionIndex=0
        answerIndex=0
        for question in list_of_questions:
            question =question.replace("\"","")
            list_of_questions[questionIndex] = question

            questionIndex=questionIndex+1
            if(questionIndex==1 and ":" in question):
                q1 = question.split(":")
                question=q1[1]
                list_of_questions[0]=q1[1]

        for answer in list_of_answers:
            answer =answer.replace("\"","")
            list_of_answers[answerIndex] = answer

            answerIndex=answerIndex+1
            if(answerIndex==1 and ":" in answer):
                a1 = answer.split(":")
                answer=a1[1]
                list_of_answers[0]=a1[1]
        
        update_index(tableName,input_url,list_of_questions,list_of_answers,datetime.now().strftime('%d-%m-%Y'))
        return {"statusCode": 200, "body": "Success"}

    except Exception as e:
        return {"statusCode": 500, "body": f"Error: {str(e)}"}
    
    