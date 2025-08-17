// auth.js

// Your web app's Firebase configuration - Corrected projectId
const firebaseConfig = {
  apiKey: "AIzaSyCYV3V0KhHjGcQhmH3Dsg9Se2PFOf5G0qY",
  authDomain: "hackmate-f9127.firebaseapp.com",
  projectId: "hackmate-f9127",
  storageBucket: "hackmate-f9127.appspot.com",
  messagingSenderId: "617200538584",
  appId: "1:617200538584:web:0204c1ce2dbe8caf798ad",
  measurementId: "G-XDMK184368"
};

// Initialize Firebase using the 'compat' libraries for simplicity with your HTML files
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const provider = new firebase.auth.GoogleAuthProvider();

/**
 * Handles the Google Sign-In process and saves the user to Firestore.
 */
function signInWithGoogle() {
    auth.signInWithPopup(provider)
        .then((result) => {
            const user = result.user;
            const userProfile = {
                name: user.displayName,
                email: user.email,
                avatar: user.photoURL,
                uid: user.uid,
                joinedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            // Save or update user data in the 'users' collection
            return db.collection('users').doc(user.uid).set(userProfile, { merge: true });
        })
        .then(() => {
            // Redirect to the teams page after a successful login
            window.location.href = 'teams.html'; 
        })
        .catch((error) => {
            console.error("Sign-In Error:", error.code, error.message);
            alert("Error signing in: " + error.message);
        });
}

/**
 * Handles the Sign-Out process.
 */
function logout() {
    auth.signOut().then(() => {
        // Redirect to the login page after signing out
        window.location.href = 'login.html';
    }).catch((error) => {
        console.error("Sign Out Error:", error);
    });
}

/**
 * Checks the user's authentication state on every page load.
 * If the user is not logged in and tries to access a protected page,
 * it redirects them to the login page.
 */
function checkAuthState() {
    const protectedPages = ['teams.html', 'profile.html', 'dashboard.html', 'resources.html'];
    // Get the current page's filename (e.g., "dashboard.html")
    const currentPage = window.location.pathname.split('/').pop();
    
    auth.onAuthStateChanged(user => {
        if (!user && protectedPages.includes(currentPage)) {
            // If user is not logged in and is on a protected page, redirect to login
            window.location.href = 'login.html';
        }
    });
}

// Run the authentication check on every page that includes this script
checkAuthState();
