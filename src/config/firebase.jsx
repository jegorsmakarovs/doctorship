import { initializeApp } from "firebase/app";
import { getAuth} from "firebase/auth";
import {getFirestore} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAg0m5QSTkYuvphZbfZZunXBD6QLoGpaTA",
  authDomain: "doctorship-efe25.firebaseapp.com",
  projectId: "doctorship-efe25",
  storageBucket: "doctorship-efe25.firebasestorage.app",
  messagingSenderId: "632585084145",
  appId: "1:632585084145:web:1c31df201cf96fd5205d50"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);