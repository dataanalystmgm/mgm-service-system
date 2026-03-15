import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAZNEa41qvZaTyT0efUe5IIfAvPZxS2KWU",
  authDomain: "mgm-service-system.firebaseapp.com",
  projectId: "mgm-service-system",
  storageBucket: "mgm-service-system.firebasestorage.app",
  messagingSenderId: "1091374740398",
  appId: "1:1091374740398:web:3062eabf6042ef623b8e3f",
  measurementId: "G-E2WBP7V3NV"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);