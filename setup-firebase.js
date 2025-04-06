// This script helps you set up Firebase for the All Log Rythm project
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('=== Firebase Setup for All Log Rythm ===');
console.log('This script will help you set up Firebase for your project.');
console.log('You will need to create a Firebase project and get your configuration values.');
console.log('Follow these steps:');
console.log('1. Go to https://console.firebase.google.com/');
console.log('2. Create a new project or select an existing one');
console.log('3. Click on the web icon (</>) to add a web app to your project');
console.log('4. Register your app with a nickname');
console.log('5. Copy the firebaseConfig object values\n');

const questions = [
  'Enter your Firebase API Key: ',
  'Enter your Firebase Auth Domain: ',
  'Enter your Firebase Project ID: ',
  'Enter your Firebase Storage Bucket: ',
  'Enter your Firebase Messaging Sender ID: ',
  'Enter your Firebase App ID: '
];

const answers = [];

function askQuestion(index) {
  if (index >= questions.length) {
    updateFirebaseConfig(answers);
    rl.close();
    return;
  }

  rl.question(questions[index], (answer) => {
    answers.push(answer);
    askQuestion(index + 1);
  });
}

function updateFirebaseConfig(config) {
  const firebaseConfigPath = path.join(__dirname, 'src', 'config', 'firebase.ts');
  
  let content = fs.readFileSync(firebaseConfigPath, 'utf8');
  
  // Replace the placeholder values with the actual values
  content = content.replace(/apiKey: "YOUR_API_KEY"/, `apiKey: "${config[0]}"`);
  content = content.replace(/authDomain: "YOUR_AUTH_DOMAIN"/, `authDomain: "${config[1]}"`);
  content = content.replace(/projectId: "YOUR_PROJECT_ID"/, `projectId: "${config[2]}"`);
  content = content.replace(/storageBucket: "YOUR_STORAGE_BUCKET"/, `storageBucket: "${config[3]}"`);
  content = content.replace(/messagingSenderId: "YOUR_MESSAGING_SENDER_ID"/, `messagingSenderId: "${config[4]}"`);
  content = content.replace(/appId: "YOUR_APP_ID"/, `appId: "${config[5]}"`);
  
  fs.writeFileSync(firebaseConfigPath, content);
  
  console.log('\nFirebase configuration updated successfully!');
  console.log('Next steps:');
  console.log('1. Set up Firestore Database in your Firebase Console');
  console.log('2. Create the following collections: users, logs, notifications');
  console.log('3. Run your application with: npm run dev');
}

askQuestion(0); 