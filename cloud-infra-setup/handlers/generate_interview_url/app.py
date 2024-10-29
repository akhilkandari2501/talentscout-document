import uuid
import boto3
import os

dynamodb = boto3.client('dynamodb')

def generate_unique_id():
    return str(uuid.uuid4())
def update_index(tableName, unique_id,url, candidate_name, questions, model_answers, submitted_answers=None):
    # Use an empty list if submitted_answers is not provided
    submitted_answers = submitted_answers or []
    for question_dict in questions:
        if 'S' in question_dict:
            question_dict['S'] = question_dict['S'].replace('Irshad', candidate_name)
    response = dynamodb.put_item(
        TableName=tableName,
        Item={
            'uuid_key': {'S': unique_id},
            'candidate-name': {'S': candidate_name},
            'interview-url':{'S':url},
            'questions': {'L': questions},  # 'L' indicates a list
            'model-answers': {'L': model_answers} # 'L' for Model_Answers list
        }
    )
    return response
def get_data_by_Interview_Url(tableName, Interview_Url):
    try:
        response = dynamodb.query(
        TableName=tableName,
        KeyConditionExpression='#interview_url = :Interview_Url',
        ExpressionAttributeNames={
            '#interview_url': 'interview-url'
        },
        ExpressionAttributeValues={
            ':Interview_Url': {'S': Interview_Url}
        }
    )
        items = response.get('Items', [])
        if items:
            # Items found, return the list of data
            return [{
                'interview-url': item['interview-url']['S'],
                'questions': item['question']['L'],
                'model-answers': item['model-answer']['L'],
                'complexity': item['complexity']['S'],
                'topic': item['topic']['S'],
                'sub-Topic': item['sub-topic']['S'],
                'language': item['language']['S'],
                'create-date': item['create-date']['S']
            } for item in items]
            print("ok")
        else:
            # Items not found
            print("Items not found")
            return None
            
    except Exception as e:
        # Handle exceptions as needed (e.g., log the error)
        print(f"Error in fetching: {e}")
        return None
def get_model_qna_from_DB(input_url):
    table_name= os.environ['questionbank_tbl']
    table_output = get_data_by_Interview_Url(table_name, input_url)
    list_of_questions = []  # Initialize the list of questions
    for item in table_output:  # Iterate over the retrieved items
        list_of_questions = item.get('questions')
    list_of_answers = []  # Initialize the list of answers
    for item in table_output:
        list_of_answers = item.get('model-answers')
    return [list_of_questions, list_of_answers]
def lambda_handler(event, context):
    name = event['name']
    input_url = event['input_url']
    table_name = os.environ['Candidate_tbl']
    try:
        unique_id = generate_unique_id()
        cloudfront_Url=os.environ['cloudfront_Url']
        list_of_questions, list_of_answers = get_model_qna_from_DB(input_url)
        print(list_of_questions)
        update_index(table_name,unique_id,input_url,name,list_of_questions,list_of_answers,list_of_answers)
        url = f'interview_page.html?interview_id={unique_id}'
        return {"statusCode": 200, "body": f"{url}"}
    except Exception as e:
        return {"statusCode": 500, "body": f"Error: {str(e)}"}

