import { useState, useEffect, useCallback, useRef } from 'react'
import { auth, db } from './firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { 
  collection, 
  addDoc, 
  setDoc,
  doc,
  getDoc,
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore'
import { Auth } from './components/Auth'
import { templates } from './constants/templates'
import './index.css'

// Icons
const SaveIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

const CopyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const LogoutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const InstagramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const InfoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);

const SettingsIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
);

const SUBJECT_OPTIONS = {
  apology: ["Late arrival to office/school", "Missing an important deadline", "Inappropriate behavior", "Errors in submitted work", "Custom..."],
  request: ["Leave of absence application", "Request for recommendation letter", "Meeting appointment request", "Resource/Equipment request", "Custom..."],
  complaint: ["Service delay complaint", "Poor quality of products", "Inadequate facilities", "Staff behavior issue", "Custom..."],
  thanks: ["Appreciation for guidance", "Thank you for the opportunity", "Acknowledgment of support", "Personal thank you note", "Custom..."]
};

const TITLES = ["Mr.", "Ms.", "Dr.", "Prof.", "The Principal", "The Manager", "Custom..."];

const CATEGORIES = [
  { id: 'apology', label: 'Apology Letter' },
  { id: 'request', label: 'Formal Request' },
  { id: 'complaint', label: 'Complaint Letter' },
  { id: 'thanks', label: 'Thank You Note' }
];

const CustomSelect = ({ id, value, onChange, options, className = "", displayValue }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`custom-select-container ${className}`} ref={dropdownRef}>
      <div 
        className={`custom-select-trigger ${isOpen ? 'active' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">{displayValue || value}</span>
        <svg className={`chevron-select ${isOpen ? 'rotate' : ''}`} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </div>
      {isOpen && (
        <div className="custom-select-options">
          {options.map((opt) => {
            const isObj = typeof opt === 'object';
            const optVal = isObj ? opt.id : opt;
            const optLabel = isObj ? opt.label : opt;
            return (
              <div 
                key={optVal} 
                className={`custom-select-option ${value === optVal ? 'selected' : ''}`}
                onClick={() => {
                  onChange({ target: { id, value: optVal } });
                  setIsOpen(false);
                }}
              >
                {optLabel}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

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
        // Fetch/Listen to Profile
        const profileRef = doc(db, 'profiles', currentUser.uid);
        const unsubscribeProfile = onSnapshot(profileRef, (snapshot) => {
          if (snapshot.exists()) {
            const profileData = snapshot.data();
            setProfile(profileData);
            // Auto-fill senderName if profile loaded and field empty
            setFormData(prev => {
              if (!prev.senderName) {
                return { ...prev, senderName: profileData.preferredName || currentUser.displayName || currentUser.email.split('@')[0] };
              }
              return prev;
            });
          } else {
            // No profile yet, use auth data
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
      <header className="navbar">
        <div className="navbar-inner">
          <div className="navbar-brand">
            <div className="brand-dot"></div>
            <h1>Letter Generator Pro</h1>
          </div>
          
          <div className="navbar-actions" ref={menuRef}>
            <button className={`profile-pill ${showUserMenu ? 'active' : ''}`} onClick={() => setShowUserMenu(!showUserMenu)}>
              <div className="profile-img">{(user.displayName || user.email)[0].toUpperCase()}</div>
              <span className="profile-text">{profile.preferredName || user.displayName || user.email.split('@')[0]}</span>
              <svg className={`chevron-svg ${showUserMenu ? 'rotate' : ''}`} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
            
            {showUserMenu && (
              <div className="popover-menu">
                {!showSettings ? (
                  <>
                    <div className="popover-user">
                      <div className="popover-avatar">{(user.displayName || user.email)[0].toUpperCase()}</div>
                      <div className="popover-meta">
                        <p className="p-name">{profile.preferredName || user.displayName || user.email.split('@')[0]}</p>
                        <p className="p-email">{user.email}</p>
                      </div>
                    </div>
                    <div className="popover-links">
                      <button className="popover-btn" onClick={() => setShowSettings(true)}>
                        <SettingsIcon /> User Settings
                      </button>
                      <button className="popover-btn logout-link" onClick={() => signOut(auth)}>
                        <LogoutIcon /> Sign Out
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="settings-panel fade-in">
                    <div className="settings-header">
                      <button className="back-btn" onClick={() => setShowSettings(false)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="15 18 9 12 15 6"></polyline></svg>
                        Back
                      </button>
                      <h4>Account Settings</h4>
                    </div>
                    <form className="settings-form" onSubmit={handleProfileUpdate}>
                      <div className="control-group">
                        <label>Preferred Legal Name</label>
                        <input 
                          type="text" 
                          placeholder="Your Full Name" 
                          value={profile.preferredName}
                          onChange={(e) => setProfile({ ...profile, preferredName: e.target.value })}
                        />
                        <p className="hint-text">This name will be used to auto-fill your letters.</p>
                      </div>
                      <button type="submit" className="btn-solid tiny-btn">Update Profile</button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Centered Tab Switcher */}
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
          <div className="editor-workspace fade-in">
            <section className="form-section">
              <div className="section-title">
                <h2>Configuration</h2>
                <p>Define your letter's context</p>
              </div>
              <div className="grid-3">
                <div className="control-group">
                  <label>Category</label>
                  <CustomSelect 
                    id="letterType" 
                    value={formData.letterType} 
                    displayValue={CATEGORIES.find(c => c.id === formData.letterType)?.label}
                    options={CATEGORIES} 
                    onChange={handleChange} 
                  />
                </div>
                <div className="control-group">
                  <label>Date</label>
                  <input type="date" id="letterDate" value={formData.letterDate} onChange={handleChange} />
                </div>
                <div className="control-group">
                  <label>Subject</label>
                  <CustomSelect 
                    id="reason" 
                    value={formData.reason} 
                    options={SUBJECT_OPTIONS[formData.letterType]} 
                    onChange={handleChange} 
                  />
                </div>
              </div>
              {formData.reason === 'Custom...' && (
                <div className="control-group mt-1">
                  <input
                    type="text"
                    id="customReason"
                    placeholder="Type your own subject..."
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  />
                </div>
              )}
            </section>

            <section className="form-section">
              <div className="section-title">
                <h2>Letter Details</h2>
                <p>Add specific information for the recipient</p>
              </div>
              <div className="grid-2">
                <div className="control-group">
                  <label>Your Name</label>
                  <input type="text" id="senderName" value={formData.senderName} onChange={handleChange} placeholder="John Doe" />
                </div>
                <div className="control-group">
                  <label>Recipient Name</label>
                  <div className="split-input">
                    <CustomSelect 
                      className="tiny-custom-select"
                      id="recipientTitle" 
                      value={formData.recipientTitle} 
                      options={TITLES} 
                      onChange={handleChange} 
                    />
                    <input type="text" id="recipientName" value={formData.recipientName} onChange={handleChange} placeholder="Full Name" />
                  </div>
                </div>
                <div className="control-group">
                  <label>Your Address</label>
                  <textarea id="senderAddress" rows="2" value={formData.senderAddress} onChange={handleChange} placeholder="Your Address" />
                </div>
                <div className="control-group">
                  <label>Recipient Address</label>
                  <textarea id="recipientAddress" rows="2" value={formData.recipientAddress} onChange={handleChange} placeholder="Recipient's Address" />
                </div>
                <div className="control-group full-width">
                  <label>Additional Context (Optional)</label>
                  <textarea id="details" rows="3" value={formData.details} onChange={handleChange} placeholder="Any specific details to include..." />
                </div>
              </div>
              <div className="form-actions">
                <button className="btn-solid" onClick={handleManualGenerate}>
                  Generate & Preview
                </button>
                {generatedLetter && (
                  <button className="btn-ghost" onClick={saveLetter}>
                    <SaveIcon /> Cloud Save
                  </button>
                )}
              </div>
            </section>

            {savedLetters.length > 0 && (
              <section className="form-section cloud-section">
                <div className="section-title">
                  <h2>Saved Drafts</h2>
                </div>
                <div className="draft-grid">
                  {savedLetters.map(letter => (
                    <div key={letter.id} className="draft-card" onClick={() => loadLetter(letter)}>
                      <div className="draft-meta">
                        <span className="draft-tag">{letter.letterType}</span>
                        <span className="draft-date">{formatDate(letter.letterDate)}</span>
                      </div>
                      <h3>{letter.reason}</h3>
                      <p>{letter.recipientName}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="preview-workspace fade-in">
            {generatedLetter ? (
              <>
                <div className="preview-toolbar">
                  <div className="toolbar-info">
                    <h2>Document Preview</h2>
                    <p>Professional formal formatting applied</p>
                  </div>
                  <button className="btn-action" onClick={() => {
                    navigator.clipboard.writeText(generatedLetter);
                    alert('Copied to clipboard!');
                  }}>
                    <CopyIcon /> Copy Document
                  </button>
                </div>
                
                <div className="canvas">
                  <div className="sheet">
                    <div className="sheet-texture"></div>
                    <div className="sheet-content">
                      {generatedLetter}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-preview-state">
                  <div className="empty-info-box">
                      <InfoIcon />
                      <h3>No Letter Generated Yet</h3>
                      <p>Please provide the recipient and sender details in the <b>Edit Mode</b> to generate a preview.</p>
                      <button className="btn-solid mt-1" onClick={() => setActiveTab('edit')}>Go back to Editor</button>
                  </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="compact-footer">
        <div className="footer-content-bar">
          <div className="footer-left-info">
            <p>© 2026 Letter Generator Pro</p>
            <p className="credit-text">Designed by <a href="https://www.instagram.com/a7_visuals/" target="_blank" rel="noopener noreferrer">A7 Visuals</a></p>
          </div>
          <div className="footer-right-actions">
            <a href="https://www.instagram.com/a7_visuals/" target="_blank" rel="noopener noreferrer" className="insta-link">
              <InstagramIcon />
              <span>@a7_visuals</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
