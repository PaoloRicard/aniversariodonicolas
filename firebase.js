import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

export const firebaseConfig = {
    apiKey: "AIzaSyDSefOoe0-1sxmzuWldAISBcQlvYzeRvg0",
    authDomain: "listadepresentesnicolas.firebaseapp.com",
    projectId: "listadepresentesnicolas",
    storageBucket: "listadepresentesnicolas.firebasestorage.app",
    messagingSenderId: "888460217085",
    appId: "1:888460217085:web:7cc3de39d56a86fc548c94",
    measurementId: "G-R1GKB5VGWZ"
  };

const hasFirebaseConfig = !firebaseConfig.apiKey.includes("COLE_") &&
  !firebaseConfig.projectId.includes("SEU_");

const app = hasFirebaseConfig ? initializeApp(firebaseConfig) : null;
const db = app ? getFirestore(app) : null;

export {
  addDoc,
  collection,
  db,
  deleteDoc,
  doc,
  getDoc,
  hasFirebaseConfig,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc
};
