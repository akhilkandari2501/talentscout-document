// TODO: Update the value below 

export const COGNITO_IDENTITY_POOL_ID = "" // Enter your CognitoIdentityPoolId that you have created.
export const REGION = ""; 
export const START_STEPFUNCTION_LAMBDA=""; // Enter the lambda function name that starts the stepfunction workflow (from Cloudformation output section)
export const RESPONSE_EVALUATION_LAMBDA=""; // Enter the lambda function name that starts the response-evaluation function (from Cloudformation output section)
export const CANDIDATE_DDB=""; // Enter the dynamodb table  name of  Candidate table (from Cloudformation output section)
export const INTERVIEW_DDB="";  // Enter the dynamodb table name of Interview table(from Cloudformation output section)
export const EVALUATION_DDB=""; // Enter the dynamodb table name of  Evaluation table(from Cloudformation output section)
export const DASHBOARD_DDB="";  // Enter thedynamodb table name of Dashboard table(from Cloudformation output section)

export const LOGIN_LINK = ""; //hosted ui login link https://<your_domain>/login?client_id=<your_app_client_id>>&response_type=code&scope=email+openid+phone&redirect_uri=http%3A%2F%2F<your_domain>%2Fjobreadiness.html
export const SIGNUP_LINK = ""; //hosted ui signup link https://<your_domain>/signup?client_id=<your_app_client_id>>&response_type=code&scope=email+openid+phone&redirect_uri=http%3A%2F%2F<your_domain>%2Fjobreadiness.html
export const ENDPOINT = ""; //hosted ui auth endpoint https://<your_domain>/oauth2/token
export const CLIENT_ID = "";  //cognito client_id for app integration
export const REDIRECT_URI = ""; //https://<cloudfront Distribution domain name>/jobreadiness.html