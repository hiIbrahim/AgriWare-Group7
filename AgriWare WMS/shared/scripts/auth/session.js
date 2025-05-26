// shared/scripts/auth/session.js
import { MOCK_PROFILES, SESSION_DURATION, SESSION_TIMEOUT, DEFAULT_REDIRECT } from '../config.js';
import { showNotification } from '../ui/notification.js';

export async function checkSession() {
  try {
    // Skip check for index page or login page
    const path = window.location.pathname;
    if (path.endsWith('index.html') || 
        path === '/' ||
        path.includes('login.html')) {
      return null;
    }

    const userData = localStorage.getItem('wms_user');
    if (!userData) {
      throw new Error('No session data');
    }

    const user = JSON.parse(userData);
    const lastActive = localStorage.getItem('last_active');

    // Validate session expiration
    const isExpired = user.expiresAt && user.expiresAt < Date.now();
    const isInactive = lastActive && (Date.now() - lastActive > SESSION_TIMEOUT);

    if (isExpired || isInactive) {
      throw new Error('Session expired');
    }

    // Update session timestamps
    user.lastActive = Date.now();
    localStorage.setItem('wms_user', JSON.stringify(user));
    localStorage.setItem('last_active', Date.now().toString());

    return user;
  } catch (error) {
    console.error('Session check failed:', error);
    clearSession();
    
    // Don't redirect if we're already on an auth page
    if (!window.location.pathname.includes('login.html') &&
        !window.location.pathname.includes('401.html')) {
      window.location.href = `${DEFAULT_REDIRECT}?session_expired=1`;
    }
    
    return null;
  }
}

export function clearSession() {
  ['wms_user', 'csrf_token', 'last_active'].forEach(key => {
    localStorage.removeItem(key);
  });
}

export function createSession(user) {
  const sessionData = {
    ...user,
    expiresAt: Date.now() + SESSION_DURATION,
    lastActive: Date.now()
  };
  localStorage.setItem('wms_user', JSON.stringify(sessionData));
  localStorage.setItem('last_active', Date.now().toString());
  generateCSRFToken();
}


export async function getProfileData(userId = null) {
  const user = await checkSession(); // Added await since checkSession is async
  if (!user) throw new Error('No authenticated user');
  
  const profileId = userId || user.id;
  const profile = MOCK_PROFILES[profileId];
  
  if (!profile) throw new Error(`Profile not found for ID: ${profileId}`);
  
  return {
    ...profile,
    lastActive: user.lastActive,
    permissions: user.permissions || []
  };
}

function generateCSRFToken() {
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  localStorage.setItem('csrf_token', token);
  return token;
}