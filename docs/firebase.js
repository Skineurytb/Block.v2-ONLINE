// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCsWUVcot8Hc70na3PJm84i0xc1_rIb8KI",
  authDomain: "blockv2online.firebaseapp.com",
  projectId: "blockv2online",
  storageBucket: "blockv2online.firebasestorage.app",
  messagingSenderId: "434258453142",
  appId: "1:434258453142:web:b5045f47292375e1c4d8b7",
  measurementId: "G-QZM9RJ8XE3"
};

// Initialize Firebase (using CDN scripts in HTML)
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// API base URL
const API_BASE = 'http://localhost:8000';

// API fetch helper with auth token
async function apiFetch(path, options = {}) {
  if (!auth.currentUser) {
    throw new Error('Not authenticated');
  }

  const idToken = await auth.currentUser.getIdToken(true);
  const headers = {
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (options.body && typeof options.body === 'object') {
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!response.ok) {
    let err;
    try { err = await response.json(); } catch { err = { error: response.statusText }; }
    throw new Error(err.error || response.statusText || 'Request failed');
  }

  return await response.json();
}

// Make available globally
window.apiFetch = apiFetch;
window.auth = auth;
window.db = db;