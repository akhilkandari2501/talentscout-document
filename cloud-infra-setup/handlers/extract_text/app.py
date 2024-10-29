import json
import boto3
from botocore.exceptions import ClientError
import requests
import os
from trafilatura import extract
dynamodb = boto3.client('dynamodb')
bedrock_runtime_client = boto3.client(service_name='bedrock-runtime')
s3_client = boto3.client('s3')
transcribe = boto3.client('transcribe')
def get_text_from_website(url):
    try:
        response = requests.get(url)
        response.raise_for_status() # Raise an exception for bad responses
        text_content = extract(response.content)
        return text_content
    except requests.RequestException as e:
        raise Exception(f"Error retrieving data from website: {e}")
def transcribe_video_to_text(job_name, video_url, output_bucket):
    try:
        response = transcribe.start_transcription_job(
            TranscriptionJobName=job_name,
            LanguageCode='en-US',
            MediaFormat='mp4',
            Media={'MediaFileUri': video_url},
            OutputBucketName=output_bucket
        )
        transcribe_job_status = wait_for_transcription_job(job_name)
        if transcribe_job_status == 'COMPLETED':
            output_key = f"{job_name}.json"
            output_file_uri = f's3://{output_bucket}/{output_key}'
            s3_client.download_file(output_bucket, output_key, 'transcription_result.json')
            with open('transcription_result.json', 'r') as file:
                json_data = json.load(file)
                return json_data['results']['transcripts'][0]['transcript']
        else:
            raise Exception(f"Transcription job failed with status: {transcribe_job_status}")
    except Exception as e:
        raise Exception(f"Error transcribing video: {e}")
def wait_for_transcription_job(job_name):
    while True:
        status = transcribe.get_transcription_job(TranscriptionJobName=job_name)
        if status['TranscriptionJob']['TranscriptionJobStatus'] in ['COMPLETED', 'FAILED']:
            return status['TranscriptionJob']['TranscriptionJobStatus']
def extract_content(url, content_type):
    try:
        if content_type == 'website':
            return get_text_from_website(url)
        elif content_type == 'video':
            output_bucket = 'your-s3-bucket-name'
            job_name = f'transcribe_job_{int(time.time())}'
            return transcribe_video_to_text(job_name, url, output_bucket)
    except Exception as e:
        raise Exception(f"Error extracting content: {e}")
def summarize_content(content):
    # print("Input: to summerize", content)
    try:
        template = """
            Claude, assume the role of a technical recruiter whose job is to screen candidates,
            You need to read through the whole webpage text that will be provided and provide me a
            brief summary of important contents that you see in this input text. In your answer you
            shouln't miss some of the important topics that are present in the original text and your
            summary should be in a paragraph with atleast 1000 english words.
        """
        prompt_data = f"{template}extracted_text: {content}:"
        messages = [
            {
                "role": "user",
                "content": prompt_data
            }
        ]
        body = json.dumps(
        {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 30000,
        "messages":  messages,
        "temperature": 0.1,
        "top_p": 0.9
        }
        )
        model_id = 'anthropic.claude-3-haiku-20240307-v1:0'
        accept = 'application/json'
        content_type = 'application/json'
        print("bedrock reached")
        response = bedrock_runtime_client.invoke_model(body=body, modelId=model_id, accept=accept, contentType=content_type)
        response_body = json.loads(response.get("body").read())
        print(response_body["content"][0]["text"])
        return response_body["content"][0]["text"]
    except Exception as e:
        raise Exception(f"Error summarizing content: {e}")
def update_index(table_name, url, content_type, transcript, summary):
    try:
        response = dynamodb.put_item(
            TableName=table_name,
            Item={
                'interview-url': {'S': url},
                'interview-url-type': {'S': content_type},
                'transcript': {'S': transcript},
                'summary': {'S': summary}
            }
        )
        return response
    except ClientError as e:
        raise Exception(f"Error updating DynamoDB table: {e}")
def lambda_handler(event, context):
    input_url = event['input_url']  # Replace with your URL - from event
    input_type = event['input_url_type']
    candidate_name = event['name']
    transcript_table = os.environ['transcript_tbl']
    try:
        content = extract_content(input_url, input_type)
        print("passed extract")
        summary = summarize_content(content)
        print("passed summary")
        update_index(transcript_table, input_url, input_type, content, summary)
        return {"statusCode": 200, "body": "Success"}
    except Exception as e:
        return {"statusCode": 500, "body": f"Error: {str(e)}"}

