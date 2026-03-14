import { useState } from 'react';
import { auth, googleProvider } from '../firebase';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';

export const Auth = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card auth-card">
      <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
      <p className="subtitle">{isLogin ? 'Sign in to access your saved letters' : 'Join us to save and manage your letters'}</p>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="input-group">
          <label>Email Address</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="your@email.com" 
            required 
          />
        </div>
        <div className="input-group">
          <label>Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="••••••••" 
            required 
          />
        </div>

        {error && <p className="error-text">{error}</p>}

        <button type="submit" className="primary-btn" disabled={loading}>
          {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
        </button>
      </form>

      <div className="divider"><span>OR</span></div>

      <button className="google-btn" onClick={handleGoogleSignIn} disabled={loading}>
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
        Continue with Google
      </button>

      <p className="auth-footer">
        {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
        <span onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Sign Up' : 'Sign In'}
        </span>
      </p>
    </div>
  );
};
