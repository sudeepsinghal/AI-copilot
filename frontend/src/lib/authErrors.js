/**
 * Maps Firebase Authentication error codes to user-friendly "soft" messages.
 * 
 * @param {string} errorCode - The error code returned from Firebase (e.g., 'auth/email-already-in-use')
 * @returns {string} - A clean, human-readable error message.
 */
export function getAuthErrorMessage(errorCode) {
  switch (errorCode) {
    // --- Sign Up Specific Errors ---
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please sign in instead.';
    case 'auth/invalid-email':
      return 'The email address you entered is not valid.';
    case 'auth/weak-password':
      return 'Your password is too weak. Please use at least 6 characters.';
    
    // --- Sign In Specific Errors ---
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      // For security reasons, it's best practice not to specify whether the email or password was wrong.
      return 'Invalid email or password. Please try again.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    
    // --- Social / OAuth Provider Errors ---
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using a different sign-in method. Try Google or GitHub.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed before finishing. Please try again.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the sign-in popup. Please allow popups for this site.';
    case 'auth/cancelled-popup-request':
      return 'The sign-in request was cancelled. Please try again.';

    // --- General / Network Errors ---
    case 'auth/operation-not-allowed':
      return 'This sign-in method is currently disabled. Please contact support.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection and try again.';
    
    // --- Fallback ---
    default:
      if (errorCode) {
        return `An unexpected error occurred (${errorCode}). Please try again later.`;
      }
      return 'An unexpected error occurred. Please try again later.';
  }
}
