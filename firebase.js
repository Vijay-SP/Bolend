import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
const firebaseConfig = {
    apiKey: "AIzaSyDUQgIEBu_PhwWQn5bYWzW39rNJRO8eyK8",
    authDomain: "pizza-d9b3e.firebaseapp.com",
    projectId: "pizza-d9b3e",
    storageBucket: "pizza-d9b3e.appspot.com",
    messagingSenderId: "369038231274",
    appId: "1:369038231274:web:8b8c35fa8341e00f583993"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider, db, storage };
