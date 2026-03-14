import { useState } from 'react';
import { auth, googleProvider } from '../firebase';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';

const EyeIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" />
  </svg>
);

export const Auth = ({ isLogin, onToggleMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      setLoading(true);
      setError('');
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      let friendlyError = err.message;
      if (err.code === 'auth/configuration-not-found') {
        friendlyError = "Auth not enabled in Firebase Console. Enable Email/Password and Google.";
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        friendlyError = "Invalid email or password.";
      }
      setError(friendlyError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card auth-card">
      <h2 style={{fontSize: '2.5rem', marginBottom: '0.5rem', fontWeight: 800, textAlign: 'center'}}>
        {isLogin ? 'Welcome Back' : 'Create Account'}
      </h2>
      <p className="subtitle">
        {isLogin ? 'Sign in to access your saved letters' : 'Join us to store your professional letters'}
      </p>

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <div className="input-group">
          <label>Email Address</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="your@email.com" 
            autoComplete="email"
            required 
          />
        </div>
        <div className="input-group">
          <label>Password</label>
          <div style={{ position: 'relative' }}>
            <input 
              type={showPassword ? "text" : "password"} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••" 
              autoComplete={isLogin ? "current-password" : "new-password"}
              style={{ paddingRight: '3.5rem' }}
              required 
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex'
              }}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            padding: '1rem',
            borderRadius: '12px',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            margin: '0.5rem 0',
            fontSize: '0.9rem',
            color: '#ef4444'
          }}>
            {error}
          </div>
        )}

        <button type="submit" className="primary-btn" disabled={loading} style={{width: '100%', marginTop: '0.5rem'}}>
          {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
        </button>
      </form>

      <div className="divider"><span>OR</span></div>

      <button type="button" className="google-btn" onClick={handleGoogleSignIn} disabled={loading}>
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="20" height="20" />
        Continue with Google
      </button>

      <p className="auth-footer" style={{marginTop: '2.5rem', textAlign: 'center'}}>
        {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
        <button 
          type="button"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--primary)',
            fontWeight: 800,
            cursor: 'pointer',
            padding: '0.5rem',
            fontSize: 'inherit',
            textDecoration: 'underline'
          }}
          onClick={onToggleMode}
        >
          {isLogin ? 'Create one now' : 'Sign in here'}
        </button>
      </p>
    </div>
  );
};
