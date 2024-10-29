import json
import boto3
import uuid
import os
import string
import asyncio
import time

def generate_unique_id():
    return str(uuid.uuid4())

region = os.environ['REGION']
sfclient = boto3.client('stepfunctions', region_name=region) #the region name here should be dynamic - pick from the variables file.
state_machine_arn = os.environ['STEP_FUNCTIONS_ARN']

async def statuscheck(arn):
    try:
        response = sfclient.describe_execution(executionArn=arn)
        op = response["status"]
        print(op)
        return op
    except Exception as e:
        print('Error in status check:', e)

async def getoutput(arn):
    try:
        response = sfclient.describe_execution(executionArn=arn)
        op = json.loads(response["output"])
        answer = op["body"]
        print(answer)
        return answer
    except Exception as e:
        print('Error in status check:', e)

async def invoke(arn, input_data):
    try:
        execution_name = f"{generate_unique_id()}-{int(time.time())}"
        response = sfclient.start_execution(
            stateMachineArn=arn,
            name=execution_name,
            input=json.dumps(input_data)
        )
        op = response["executionArn"]
        return op
    except Exception as e:
        print('Error invoking execution:', e)
        raise

async def main(arn, input_json):
    try:
        execution_arn = await invoke(arn, input_json)
        print(execution_arn)
        while True:
            status = await statuscheck(execution_arn)
            if status == "SUCCEEDED":
                output = await getoutput(execution_arn)
                print(f"Interview link: {output}")
                return output
            elif status != "RUNNING":
                print(f"Execution failed with status: {status}")
                break
            await asyncio.sleep(2.5)
    except Exception as e:
        print(f"There was an error: {e}")
        raise

def lambda_handler(event, context):
    try:
        result = asyncio.run(main(state_machine_arn, event))
        return {
            'statusCode': 200,
            'body': f"{result}"
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': f"Error: {str(e)}"
        }

