
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth"

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "xanalysis-11d61.firebaseapp.com",
  projectId: "xanalysis-11d61",
  storageBucket: "xanalysis-11d61.firebasestorage.app",
  messagingSenderId: "234881472571",
  appId: "1:234881472571:web:58663fbde16a2cce9ea41e",
  measurementId: "G-XJGSXFL490"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider()

export { auth, provider }