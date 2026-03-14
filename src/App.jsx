import { useState, useEffect, useCallback, useRef } from 'react'
import { auth, db } from './firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { 
  collection, 
  addDoc, 
  setDoc,
  doc,
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore'

import { LoginPage } from './components/LoginPage'
import { SignupPage } from './components/SignupPage'
import { templates } from './constants/templates'
import { SUBJECT_OPTIONS, CATEGORIES } from './constants/formConstants'
import { Navbar } from './components/Navbar'
import { EditorWorkspace } from './components/EditorWorkspace'
import { PreviewWorkspace } from './components/PreviewWorkspace'
import { Footer } from './components/Footer'
import './index.css'

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ preferredName: '' });
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('app-theme') || 'dark';
    } catch (e) {
      return 'dark';
    }
  });
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('edit'); 
  const [savedLetters, setSavedLetters] = useState([]);
  const [formData, setFormData] = useState({
    senderName: '',
    senderAddress: '',
    recipientTitle: 'Mr.',
    recipientName: '',
    recipientAddress: '',
    letterDate: new Date().toISOString().split('T')[0],
    letterType: 'apology',
    reason: 'Late arrival to office/school',
    details: ''
  });

  const [generatedLetter, setGeneratedLetter] = useState('');
  const menuRef = useRef(null);

  // Theme Effect
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  // Auth & Profile Listener
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const profileRef = doc(db, 'profiles', currentUser.uid);
        const unsubProfile = onSnapshot(profileRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setProfile(data);
            setFormData(prev => {
              if (!prev.senderName) {
                return { ...prev, senderName: data.preferredName || currentUser.displayName || currentUser.email.split('@')[0] };
              }
              return prev;
            });
          } else {
            const fallback = currentUser.displayName || currentUser.email.split('@')[0];
            setFormData(prev => !prev.senderName ? { ...prev, senderName: fallback } : prev);
          }
        });
        setLoading(false);
        return () => unsubProfile();
      } else {
        setProfile({ preferredName: '' });
        setLoading(false);
      }
    });
    return () => unsubAuth();
  }, []);

  // UI Handlers
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowUserMenu(false);
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Data Persistence
  useEffect(() => {
    if (!user) {
      setSavedLetters([]);
      return;
    }
    const q = query(
      collection(db, 'letters'), 
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setSavedLetters(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [id]: value };
      if (id === 'letterType') next.reason = SUBJECT_OPTIONS[value][0];
      return next;
    });
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      await setDoc(doc(db, 'profiles', user.uid), {
        preferredName: profile.preferredName,
        updatedAt: serverTimestamp()
      }, { merge: true });
      alert('Profile updated!');
      setShowSettings(false);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const generateLetter = useCallback(() => {
    const { senderName, senderAddress, recipientTitle, recipientName, recipientAddress, letterDate, letterType, reason, details } = formData;
    if (!senderName || !senderAddress || !recipientName || !recipientAddress || !reason) {
      setGeneratedLetter('');
      return false;
    }

    const template = templates[letterType] || templates.apology;
    const parts = letterDate.split('-');
    const formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
    const detailsVal = details ? ' ' + details : '';
    const fullRecipient = `${recipientTitle} ${recipientName}`.trim();

    let letter = template
      .replace(/{senderName}/g, senderName)
      .replace(/{senderAddress}/g, senderAddress)
      .replace(/{recipientName}/g, fullRecipient)
      .replace(/{recipientAddress}/g, recipientAddress)
      .replace(/{date}/g, formattedDate)
      .replace(/{reason}/g, reason)
      .replace(/{details}/g, detailsVal);

    letter = letter.replace(/\n{3,}/g, '\n\n');
    setGeneratedLetter(letter);
    return true;
  }, [formData]);

  useEffect(() => {
    generateLetter();
  }, [generateLetter]);

  const saveLetter = async () => {
    if (!user || !generatedLetter) return alert('Fill details first!');
    try {
      await addDoc(collection(db, 'letters'), {
        ...formData,
        content: generatedLetter,
        userId: user.uid,
        createdAt: serverTimestamp()
      });
      alert('Saved!');
    } catch (err) {
      alert('Error saving.');
    }
  };

  const loadLetter = (letter) => {
    const { content, createdAt, userId, id, ...rest } = letter;
    setFormData(prev => ({ ...prev, ...rest }));
    setGeneratedLetter(content);
    setActiveTab('preview');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleManualGenerate = () => {
    if (generateLetter()) {
      setActiveTab('preview');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      alert('Please fill field.');
    }
  };

  if (loading) return (
    <div className="app-loading">
      <div className="app-bg-mesh"></div>
      <div className="glow-orb" style={{ top: '10%', left: '10%' }}></div>
      <div className="loader"></div>
      <p>Loading Workspace...</p>
    </div>
  );

  if (!user) {
    return authMode === 'login' 
      ? <LoginPage onSwitchToSignup={() => setAuthMode('signup')} /> 
      : <SignupPage onSwitchToLogin={() => setAuthMode('login')} />;
  }

  return (
    <div className="app-root">
      <div className="app-bg-mesh"></div>
      <div className="glow-orb" style={{ top: '-100px', left: '-100px' }}></div>
      <div className="glow-orb" style={{ bottom: '-100px', right: '-100px', opacity: 0.2 }}></div>
      
      <Navbar 
        user={user}
        profile={profile}
        setProfile={setProfile}
        showUserMenu={showUserMenu}
        setShowUserMenu={setShowUserMenu}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        menuRef={menuRef}
        handleProfileUpdate={handleProfileUpdate}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <div className="view-selector-container">
        <div className="view-selector">
          <button className={`selector-tab ${activeTab === 'edit' ? 'active' : ''}`} onClick={() => setActiveTab('edit')}>
            Edit Mode
          </button>
          <button className={`selector-tab ${activeTab === 'preview' ? 'active' : ''}`} onClick={() => setActiveTab('preview')}>
            Live Preview
          </button>
        </div>
      </div>

      <main className="workspace">
        {activeTab === 'edit' ? (
          <EditorWorkspace 
            formData={formData}
            handleChange={handleChange}
            setFormData={setFormData}
            handleManualGenerate={handleManualGenerate}
            generatedLetter={generatedLetter}
            saveLetter={saveLetter}
            savedLetters={savedLetters}
            loadLetter={loadLetter}
            formatDate={(s) => s.split('-').reverse().join('/')}
          />
        ) : (
          <PreviewWorkspace generatedLetter={generatedLetter} setActiveTab={setActiveTab} />
        )}
      </main>

      <Footer />
    </div>
  )
}

export default App
