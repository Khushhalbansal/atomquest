// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCVKLf6L3QHcLIE5OL5I71Sxx4J6WY31gE",
  authDomain: "goal-setting-and-trackin-d3f97.firebaseapp.com",
  projectId: "goal-setting-and-trackin-d3f97",
  storageBucket: "goal-setting-and-trackin-d3f97.firebasestorage.app",
  messagingSenderId: "11218822032",
  appId: "1:11218822032:web:e6993d86429c0d17528915",
  measurementId: "G-KXG0G0C5YE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Analytics is only supported in browser environments that support active window APIs
let analytics = null;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

export { app, analytics };
