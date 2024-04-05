import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
const firebaseConfig = {
    apiKey: "AIzaSyCVlo8jRp5A3tkSV62wC5xJQr_3HAlwHCc",
    authDomain: "bo-lend.firebaseapp.com",
    projectId: "bo-lend",
    storageBucket: "bo-lend.appspot.com",
    messagingSenderId: "727138077389",
    appId: "1:727138077389:web:130e5323da2cd44e23b784",
    measurementId: "G-6P1ZKV95DF"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider, db, storage };
