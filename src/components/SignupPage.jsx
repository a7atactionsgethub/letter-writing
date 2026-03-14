import { useState } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, createUserWithEmailAndPassword } from 'firebase/auth';
import { AuthLayout } from './AuthLayout';
import { EyeIcon, EyeOffIcon } from './Icons';

export const SignupPage = ({ onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
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

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.code === 'auth/email-already-in-use' 
        ? "This email is already registered." 
        : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h2 className="auth-title">Create Account</h2>
      <p className="subtitle">Join us to store your professional letters</p>

      <form onSubmit={handleSignup} className="auth-form" noValidate>
        <div className="input-group">
          <label>Email Address</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="johndoe@email.com" 
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
              autoComplete="new-password"
              style={{ paddingRight: '3.5rem' }}
              required 
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="password-toggle-btn"
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <button type="submit" className="primary-btn" disabled={loading}>
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>

      <div className="divider"><span>OR</span></div>

      <button type="button" className="google-btn" onClick={handleGoogleSignIn} disabled={loading}>
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="20" height="20" />
        Continue with Google
      </button>

      <p className="auth-footer">
        Already have an account?{' '}
        <button type="button" className="auth-link-btn" onClick={onSwitchToLogin}>
          Sign in here
        </button>
      </p>
    </AuthLayout>
  );
};
