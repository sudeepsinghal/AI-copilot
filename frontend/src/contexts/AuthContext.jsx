import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup,
  fetchSignInMethodsForEmail,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  updatePassword
} from 'firebase/auth';
import { auth, googleProvider, githubProvider } from '../lib/firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    return signOut(auth);
  }

  function loginWithGoogle() {
    return signInWithPopup(auth, googleProvider);
  }

  function loginWithGithub() {
    return signInWithPopup(auth, githubProvider);
  }

  function checkEmailExists(email) {
    return fetchSignInMethodsForEmail(auth, email);
  }

  function sendMagicLink(email) {
    const actionCodeSettings = {
      url: window.location.origin + '/auth',
      handleCodeInApp: true,
    };
    return sendSignInLinkToEmail(auth, email, actionCodeSettings);
  }

  function checkIsMagicLink(href) {
    return isSignInWithEmailLink(auth, href);
  }

  function loginWithMagicLink(email, href) {
    return signInWithEmailLink(auth, email, href);
  }

  function setNewPassword(password) {
    if (auth.currentUser) {
      return updatePassword(auth.currentUser, password);
    }
    return Promise.reject(new Error("No user is currently signed in."));
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    logout,
    loginWithGoogle,
    loginWithGithub,
    checkEmailExists,
    sendMagicLink,
    checkIsMagicLink,
    loginWithMagicLink,
    setNewPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
