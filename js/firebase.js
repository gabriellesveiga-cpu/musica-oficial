
// firebase.js

import { initializeApp } 
from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import { getAuth } 
from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";


const firebaseConfig = {
  apiKey: "AIzaSyDehRNBFgVtItlqZsNpZIvhvIoHnQ5JGFo",
  authDomain: "spotfy-copia.firebaseapp.com",
  projectId: "spotfy-copia",
  storageBucket: "spotfy-copia.firebasestorage.app",
  messagingSenderId: "917370788859",
  appId: "1:917370788859:web:d7f08419665dba0576c95e",
  measurementId: "G-QF81LP0ZC0"
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);