import { HostObject } from '@amazon-sumerian-hosts/babylon';
import { Scene } from '@babylonjs/core/scene';
// eslint-disable-next-line import/extensions
import * as TranscribeClient from '../libs/transcribeClient.js';

// eslint-disable-next-line import/extensions
import * as DbClient from '../libs/dynamodbUpdate.js';
import DemoUtils from '../demo-utils.js';
import * as awsID from '../demo-credentials.js';


const chatBox = document.getElementById('chatBox');
const videoElement = document.getElementById('videoElement');
const transcribedText = document.getElementById("transcribedText");

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
let Interview = urlParams.get('interview_id')


if (!Interview) {
 
  // eslint-disable-next-line no-alert
  Interview = prompt('Please enter the interview ID:');
 
  if (!Interview) {
    // eslint-disable-next-line no-alert
    alert('Interview ID is required!');
   
  } else {
    window.location.search = `?interview_id=${Interview}`;
  }
}
console.log(Interview)

let loadedQuestions = [];

const getQuestions = async (Id) => {
  try {
    loadedQuestions=await DbClient.getq(Id); 
    console.log(loadedQuestions); 
    
  } catch (error) {
    console.error("Error:", error);
  }
}
getQuestions(Interview);

let host;
let scene;

const answerlist =[];
let currentQuestionIndex = 0;


async function setupCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoElement.srcObject = stream;
  } catch (err) {
    console.error('Error accessing camera:', err);
  }
}

async function createScene() {
  // Create an empty scene. Note: Sumerian Hosts work with both
  // right-hand or left-hand coordinate system for babylon scene
  scene = new Scene();

  const { shadowGenerator } = DemoUtils.setupSceneEnvironment(scene);
  initUi();
  setupCamera();

  // ===== Configure the AWS SDK =====

  AWS.config.region = awsID.REGION.split(':')[0];
  AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId:awsID.COGNITO_IDENTITY_POOL_ID,
  });

  // ===== Instantiate the Sumerian Host =====

  // Edit the characterId if you would like to use one of
  // the other pre-built host characters. Available character IDs are:
  // "Cristine", "Fiona", "Grace", "Maya", "Jay", "Luke", "Preston", "Wes"
  const characterId = 'Cristine';
  const pollyConfig = { pollyVoice: 'Joanna', pollyEngine: 'neural' };
  const characterConfig = HostObject.getCharacterConfig(
    './assets/character-assets',
    characterId
  );
  host = await HostObject.createHost(scene, characterConfig, pollyConfig);

  // Tell the host to always look at the camera.
  host.PointOfInterestFeature.setTarget(scene.activeCamera);

  // Enable shadows.
  scene.meshes.forEach(mesh => {
    shadowGenerator.addShadowCaster(mesh);
  });

  return scene;
}

function initUi() {
  document.getElementById('speakButton').onclick = nextQuestion.bind(this);;
}
let isSpeaking = false;
let isRecording = false;

function nextQuestion() {
  if (!isSpeaking && currentQuestionIndex < loadedQuestions.length) {
    const text = loadedQuestions[currentQuestionIndex];
    isSpeaking = true;
    host.TextToSpeechFeature.play(text).then(() => {
      console.log('Audio finished playing');
      isSpeaking = false;
      startRecording();
    }).catch(error => {
      console.error('Error playing audio:', error);
      isSpeaking = false;
    });
    
    const botMessage = document.createElement('div');
    botMessage.className = 'bot-message';
    botMessage.textContent = `Cristine : ${text}`;
    chatBox.appendChild(botMessage);
    chatBox.scrollTop = chatBox.scrollHeight;
    const line = document.createElement('div');
    line.className = 'line';
    chatBox.appendChild(line);
    
    // Once the text is spoken, start recording for the current question
    currentQuestionIndex++;
  } else {
    sendtoDb()
    .then(() => {
      console.log("Data sent to the database successfully.");
      return stopRecording();
    })
    .then(() => {
      console.log("Recording stopped.");
      const ending = "Thanks for your responses. Your Mock Interview is finished now.";
      return host.TextToSpeechFeature.play(ending);
    })
    .then(() => {
      console.log("Text-to-speech playback complete.");
      window.location.href = "evaluation.html?interview_id="+Interview;
    })
    .catch(error => {
      console.error("An error occurred:", error);
      
    });

    
};
}

function displayUserMessage() {
  const userMessage = document.createElement('div');
  if (userMessage !== '') {
    userMessage.className = 'user-message';
    userMessage.textContent = `You : ${transcribedText.innerHTML}`;
    chatBox.appendChild(userMessage);
    chatBox.scrollTop = chatBox.scrollHeight;
    const line = document.createElement('div');
    line.className = 'line';
    chatBox.appendChild(line);
  }
}


const startRecording = async () => {
  if (!isRecording) {
    window.clearTranscription();
    const selectedLanguage = "en-US";
    try {
      isRecording = true; // Set flag to true while recording
      await TranscribeClient.startRecording(selectedLanguage, onTranscriptionDataReceived);
      
    } catch(error) {
      // eslint-disable-next-line no-alert
      alert(`An error occurred while recording: ${error.message}`);
      stopRecording();
    }
  }
};

const onTranscriptionDataReceived = data => {
 
  transcribedText.insertAdjacentHTML("beforeend", data);
 
};

const sendtoDb =async ()=>{
  const text1 = Interview;
  await DbClient.main(text1,answerlist);
}

const stopRecording = function () {
  if (isRecording) {
    TranscribeClient.stopRecording();
    isRecording = false; // Reset flag after recording
  }
};

window.clearTranscription = () => {
  //userInput.innerHTML = '';
  transcribedText.innerHTML = "";
};
window.submitAns= () => {
  stopRecording();
  displayUserMessage();
  answerlist.push(transcribedText.innerHTML);
  console.log(answerlist);
  //sendtoDb();
  nextQuestion();
}
DemoUtils.loadDemo(createScene);