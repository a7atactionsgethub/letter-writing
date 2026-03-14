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

import { Auth } from './components/Auth'
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
  const [isLogin, setIsLogin] = useState(true);
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

  // Auth & Profile Listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const profileRef = doc(db, 'profiles', currentUser.uid);
        const unsubscribeProfile = onSnapshot(profileRef, (snapshot) => {
          if (snapshot.exists()) {
            const profileData = snapshot.data();
            setProfile(profileData);
            setFormData(prev => {
              if (!prev.senderName) {
                return { ...prev, senderName: profileData.preferredName || currentUser.displayName || currentUser.email.split('@')[0] };
              }
              return prev;
            });
          } else {
            const fallbackName = currentUser.displayName || currentUser.email.split('@')[0];
            setFormData(prev => !prev.senderName ? { ...prev, senderName: fallbackName } : prev);
          }
        });
        setLoading(false);
        return () => unsubscribeProfile();
      } else {
        setProfile({ preferredName: '' });
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSavedLetters(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [id]: value };
      if (id === 'letterType') newData.reason = SUBJECT_OPTIONS[value][0];
      return newData;
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
      alert('Profile updated successfully!');
      setShowSettings(false);
    } catch (err) {
      alert('Error updating profile: ' + err.message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const generateLetter = useCallback(() => {
    const { senderName, senderAddress, recipientTitle, recipientName, recipientAddress, letterDate, letterType, reason, details } = formData;
    if (!senderName || !senderAddress || !recipientName || !recipientAddress || !reason) {
      setGeneratedLetter('');
      return false;
    }

    let template = templates[letterType] || templates.apology;
    const formattedDate = formatDate(letterDate);
    const detailsText = details ? ' ' + details : '';
    const fullRecipient = `${recipientTitle} ${recipientName}`.trim();

    let letter = template
      .replace(/{senderName}/g, senderName)
      .replace(/{senderAddress}/g, senderAddress)
      .replace(/{recipientName}/g, fullRecipient)
      .replace(/{recipientAddress}/g, recipientAddress)
      .replace(/{date}/g, formattedDate)
      .replace(/{reason}/g, reason)
      .replace(/{details}/g, detailsText);

    letter = letter.replace(/\n{3,}/g, '\n\n');
    setGeneratedLetter(letter);
    return true;
  }, [formData]);

  useEffect(() => {
    generateLetter();
  }, [generateLetter]);

  const saveLetter = async () => {
    if (!user || !generatedLetter) return alert('Please fill in all details first!');
    try {
      await addDoc(collection(db, 'letters'), {
        ...formData,
        content: generatedLetter,
        userId: user.uid,
        createdAt: serverTimestamp()
      });
      alert('Letter saved successfully!');
    } catch (err) {
      alert('Could not save letter. Ensure Firestore is enabled.');
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
    const success = generateLetter();
    if (!success) {
      alert('Missing Information: Please fill in all fields to generate a preview.');
    } else {
      setActiveTab('preview');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) return (
    <div className="app-loading">
      <div className="loader"></div>
      <p>Loading Workspace...</p>
    </div>
  );

  if (!user) return <Auth isLogin={isLogin} onToggleMode={() => setIsLogin(!isLogin)} />;

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
      />

      <div className="view-selector-container">
        <div className="view-selector">
          <button 
            className={`selector-tab ${activeTab === 'edit' ? 'active' : ''}`} 
            onClick={() => setActiveTab('edit')}
          >
            Edit Mode
          </button>
          <button 
            className={`selector-tab ${activeTab === 'preview' ? 'active' : ''}`} 
            onClick={() => setActiveTab('preview')}
          >
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
            formatDate={formatDate}
          />
        ) : (
          <PreviewWorkspace 
            generatedLetter={generatedLetter}
            setActiveTab={setActiveTab}
          />
        )}
      </main>

      <Footer />
    </div>
  )
}

export default App
