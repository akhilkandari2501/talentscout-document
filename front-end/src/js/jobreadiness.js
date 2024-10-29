
// eslint-disable-next-line import/extensions
import * as LambdaClient from '../libs/LambdaClient.js';
import * as awsID from '../demo-credentials.js';

const Name = document.getElementById('name');

const content = document.getElementById('url');

const contentInputType = document.getElementById("urlType");
const documentUpload = document.getElementById("documentUpload");

contentInputType.addEventListener("change", function() {
    if (this.value === "document") {
        content.style.display = "none";
        documentUpload.style.display = "block";
    } else {
        content.style.display = "block";
        documentUpload.style.display = "none";
    }
});

const lambdaFunction = awsID.START_STEPFUNCTION_LAMBDA;
console.log(lambdaFunction);
function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

window.onload = function () {
  
   
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
 

    const requestBody = new URLSearchParams();
    requestBody.append('grant_type', 'authorization_code');
    requestBody.append('client_id', awsID.CLIENT_ID); 
    requestBody.append('code', code);
    requestBody.append('redirect_uri', awsID.REDIRECT_URI);

    const config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };

    axios.post(awsID.ENDPOINT, requestBody, config)
      .then(response => {
      //   console.log('Token response:', response.data);
        
        const accessToken = response.data.access_token;
        if (!accessToken) window.location.href = '/'; 
    
      })
      .catch(error => {
        console.error('Error:', error.response.data);
        
        window.location.href = '/';
      });
  
};

window.generate_interview_link = async () => {
    const name = Name.value;
    const urlType = contentInputType.value;
    let contentValue;

    if (urlType === "document") {
        const file = documentUpload.files[0];
        if (!file) {
            alert("Please upload a document");
            return;
        }
        contentValue = await readFileAsBase64(file);
    } else {
        contentValue = content.value;
    }
   

  if (Name.value.length === 0) {
    alert("Please enter your name");
    return;
  } 
  if (content.value.length === 0) {
    alert("Please enter the course url");
    return;
  } 
  const params = {
    FunctionName: lambdaFunction,
    Payload: JSON.stringify({
      Interview_Url :content.value,
      Interview_Url_Type :contentInputType.value,
      name : Name.value,
    }),
  };
  try {
    const data = await LambdaClient.main(params);
    const responsePayload = JSON.parse(new TextDecoder().decode(data.Payload));
    console.log(responsePayload.body);
    const outputContainer = document.getElementById("outputContainer");
    if (responsePayload.body == "Something went wrong") {
      outputContainer.innerHTML = `<p>Something went wrong</p>`;
      console.log("something wrong in generate_interview_url lambda");
      return;
    }
    else {
      outputContainer.innerHTML = `<a href="${responsePayload.body}" target="_blank">Interview link</a>`;
      console.log("link is working");
    }
    
  } catch (error) {
    alert("There was an error: " + error);
    document.getElementById('outputContainer').innerHTML = '<p>Error invoking Lambda function.</p>';
  }
};