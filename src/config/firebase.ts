import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    projectId: "vedic-ai-7e047",
    appId: "1:86488134676:web:462828c8c6436a1359e301",
    storageBucket: "vedic-ai-7e047.firebasestorage.app",
    apiKey: "AIzaSyCDylJYZmX2fi4eIVTyfzldxzAHcX_z92k",
    authDomain: "vedic-ai-7e047.firebaseapp.com",
    messagingSenderId: "86488134676",
    measurementId: "G-0ZBD8JT8J8",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
