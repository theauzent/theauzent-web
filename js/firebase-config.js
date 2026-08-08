// js/firebase-config.js

// Yahan apni Firebase credentials paste karein
const firebaseConfig = {
  apiKey: "AIzaSyAIB6xcOuboC_kBNM23RLgjnp7q7U-faps",
  authDomain: "the-auzent.firebaseapp.com",
  projectId: "the-auzent",
  storageBucket: "the-auzent.firebasestorage.app",
  messagingSenderId: "26473899968",
  appId: "1:26473899968:web:d22411f4642bf605b04a25",
  measurementId: "G-KXEDBZ31CP"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore (Database)
const db = firebase.firestore();