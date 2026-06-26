import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  GithubAuthProvider 
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDA7bD1IBxVFndeOOmjLp67c-yaTJGLkUQ",
  authDomain: "aicop-85dbf.firebaseapp.com",
  projectId: "aicop-85dbf",
  storageBucket: "aicop-85dbf.firebasestorage.app",
  messagingSenderId: "10217464044",
  appId: "1:10217464044:web:b2bce3b5d2e8a3d326c5c9",
  measurementId: "G-43VTCTSZH7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Authentication
export const auth = getAuth(app);

// Initialize Providers
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

export default app;
