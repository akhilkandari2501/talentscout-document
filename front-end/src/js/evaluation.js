import * as awsID from '../demo-credentials.js';
import * as LambdaClient from '../libs/LambdaClient.js';


let interview_id = new URLSearchParams(window.location.search).get('interview_id');

var hrefValue = "report_card.html?interview_id=" + interview_id;
console.log(interview_id);

const evaluationReportBtn = document.getElementById('evaluation-report-btn');
const dashboardBtn = document.getElementById('dashboard-btn');
const tabPanes = document.querySelectorAll('.tab-pane');
const url= document.getElementById('submit-btn');
const evaluation=awsID.RESPONSE_EVALUATION_LAMBDA;

// Function to show the Evaluation Report
const showEvaluationReport = async () => {
  const inputValue = interview_id;
  const params = {
       FunctionName: evaluation,
       Payload: JSON.stringify({
           uuid:inputValue,
       }),
     };
 try {
   //const data = await lambdaClient.send(new InvokeCommand(params));
   const data = await LambdaClient.main(params);
   const responsePayload = JSON.parse(new TextDecoder().decode(data.Payload));
   console.log(responsePayload.body);
   //document.getElementById('output').innerHTML = `<p>${responsePayload.body}</p>`;
   document.getElementById('output').innerHTML='<a class="demo-link" href="' + hrefValue + '">report</a>'
   //document.getElementById('output').innerHTML='<a class="demo-link" href="ReportCard.html">report</a>'
   console.log("Success, payload",responsePayload);

   return responsePayload;
 } catch (err) {
   console.log("Error", err);
   document.getElementById('output').innerHTML = '<p>Error invoking Lambda function.</p>';
   
 }
};

// Add click event listeners to the tab buttons
evaluationReportBtn.addEventListener('click', () => {
  // Remove the 'active' class from all tab buttons and panes
  document.querySelectorAll('.tab-button, .tab-pane').forEach(el => el.classList.remove('active'));

  // Add the 'active' class to the Evaluation Report button and pane
  evaluationReportBtn.classList.add('active');
  tabPanes[0].classList.add('active');
  document.getElementById('output').innerHTML = '<p>Please wait...</p>'
  // Call the showEvaluationReport function
  showEvaluationReport();
});

dashboardBtn.addEventListener('click', () => {
  // Remove the 'active' class from all tab buttons and panes
  document.querySelectorAll('.tab-button, .tab-pane').forEach(el => el.classList.remove('active'));

  // Add the 'active' class to the Dashboard button and pane
  dashboardBtn.classList.add('active');
  tabPanes[1].classList.add('active');
 
});

document.addEventListener("DOMContentLoaded", function() {
  // Get references to elements
  var inputField = document.getElementById('input-field');
  var submitBtn = document.getElementById('submit-btn');
  var linkContainer = document.getElementById('link-container');

  // Add event listener to submit button
  submitBtn.addEventListener('click', function() {
    var Interview_Url = inputField.value;
    var reff = "html/dashboard.html?interview_id=" + Interview_Url;
    // Update link container with the generated link
    linkContainer.innerHTML = '<a class="demo-link" href="' + reff + '">LeaderBoard</a>';
  });
});



