// Import the Firebase SDK
import firebase from 'firebase/app';
import 'firebase/database'; // Import only the modules you need

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBHyIxiH1CP33K-LdUkYEv0SJ5D7jBD4NQ",
    authDomain: "todolist-1e85f.firebaseapp.com",
    projectId: "todolist-1e85f",
    storageBucket: "todolist-1e85f.appspot.com",
    messagingSenderId: "605339194794",
    appId: "1:605339194794:web:1caa085466f85b509c87d3",
    measurementId: "G-FF79ZN3325"
  };

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get a reference to the database service
const database = firebase.database();

// Write data to the database
database.ref('test').set({
    message: 'Hello, Firebase!'
})
.then(() => {
    console.log('Data written successfully!');
})
.catch((error) => {
    console.error('Error writing data:', error);
});
