// firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCYV3V0KhHjGcQhmH3Dsg9Se2PFOf5G0qY",
    authDomain: "hackmate-f9127.firebaseapp.com",
    databaseURL: "https://hackmate-f9127-default-rtdb.firebaseio.com",
    projectId: "hackmate-f9127",
    storageBucket: "hackmate-f9127.appspot.com",
    messagingSenderId: "617200538584",
    appId: "1:617200538584:web:0204c1ce29dbe8caf798ad",
    measurementId: "G-XDMK184368"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);