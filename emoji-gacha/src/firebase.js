import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// TODO: Replace with your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDzDGBO8w353hn74iZNW_uB9D1nZlf5mh0",
  authDomain: "emoji-gacha.firebaseapp.com",
  projectId: "emoji-gacha",
  storageBucket: "emoji-gacha.firebasestorage.app",
  messagingSenderId: "659001732182",
  appId: "1:659001732182:web:a569377323b8c136f2dff7",
  measurementId: "G-ZRHMD8PVSB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

export { auth, provider, db };
