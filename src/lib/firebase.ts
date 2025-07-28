// IMPORTANT: Replace the placeholder URLs with your actual Firebase Realtime Database URLs.
import { initializeApp, getApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";

// --- Configuration for the first database ---
const firebaseConfig1 = {
  // Replace with your first database URL
  databaseURL: "https://monsterfusion-c0e4e-default-rtdb.firebaseio.com", 
};

// --- Configuration for the second database ---
const firebaseConfig2 = {
  // Replace with your second database URL
  databaseURL: "https://monster-fusion-ios-default-rtdb.firebaseio.com",
};

// Initialize the Firebase apps. We give them unique names to avoid conflicts.
const app1 = !getApps().find(app => app.name === 'db1')
  ? initializeApp(firebaseConfig1, "db1")
  : getApp("db1");

const app2 = !getApps().find(app => app.name === 'db2')
  ? initializeApp(firebaseConfig2, "db2")
  : getApp("db2");


// Get database instances for each app
const db1 = getDatabase(app1);
const db2 = getDatabase(app2);

export { db1, db2 };
