import { useState, useEffect, useCallback, useRef } from 'react'
import { auth, db } from './firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { 
  collection, 
  addDoc, 
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
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const TwitterIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
  </svg>
);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLogin, setIsLogin] = useState(true);
  const [activeTab, setActiveTab] = useState('edit');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [savedLetters, setSavedLetters] = useState([]);
  const [formData, setFormData] = useState({
    senderName: '',
    senderAddress: '',
    recipientName: '',
    recipientAddress: '',
    letterDate: new Date().toISOString().split('T')[0],
    letterType: 'apology',
    reason: '',
    details: ''
  });

  const [generatedLetter, setGeneratedLetter] = useState('');
  const menuRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser && !formData.senderName) {
        setFormData(prev => ({ ...prev, senderName: currentUser.displayName || '' }));
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
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
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const generateLetter = useCallback(() => {
    const { senderName, senderAddress, recipientName, recipientAddress, letterDate, letterType, reason, details } = formData;
    if (!senderName || !senderAddress || !recipientName || !recipientAddress || !reason) return;

    let template = templates[letterType] || templates.apology;
    const formattedDate = formatDate(letterDate);
    const detailsText = details ? ' ' + details : '';

    let letter = template
      .replace(/{senderName}/g, senderName)
      .replace(/{senderAddress}/g, senderAddress)
      .replace(/{recipientName}/g, recipientName)
      .replace(/{recipientAddress}/g, recipientAddress)
      .replace(/{date}/g, formattedDate)
      .replace(/{reason}/g, reason)
      .replace(/{details}/g, detailsText);

    letter = letter.replace(/\n{3,}/g, '\n\n');
    setGeneratedLetter(letter);
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
    setFormData(rest);
    setGeneratedLetter(content);
    if (window.innerWidth < 1100) setActiveTab('preview');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return (
    <div className="app-loading">
      <div className="loader"></div>
      <p>Syncing your profile...</p>
    </div>
  );

  if (!user) return <Auth isLogin={isLogin} onToggleMode={() => setIsLogin(!isLogin)} />;

  return (
    <div className="dashboard-layout">
      {/* Mobile Tab Bar */}
      <div className="mobile-tabs">
        <button className={`tab-btn ${activeTab === 'edit' ? 'active' : ''}`} onClick={() => setActiveTab('edit')}>✏️ Editor</button>
        <button className={`tab-btn ${activeTab === 'preview' ? 'active' : ''}`} onClick={() => setActiveTab('preview')}>📄 Preview</button>
      </div>

      <header className="app-header">
        <div className="logo-section">
          <span className="logo-icon">📝</span>
          <div>
            <h1>Indian Letter Gen</h1>
            <p className="tagline">Professional correspondence, simplified.</p>
          </div>
        </div>
        
        <div className="header-actions" ref={menuRef}>
          <button className="user-profile-trigger" onClick={() => setShowUserMenu(!showUserMenu)}>
            <div className="mini-avatar">{(user.displayName || user.email)[0].toUpperCase()}</div>
            <span className="user-name-label">{user.displayName || user.email.split('@')[0]}</span>
            <svg className={`chevron ${showUserMenu ? 'up' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>
          
          {showUserMenu && (
            <div className="user-dropdown-menu">
              <div className="dropdown-header">
                <p className="dropdown-email">{user.email}</p>
              </div>
              <button className="dropdown-item logout" onClick={() => signOut(auth)}>
                <LogoutIcon /> Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="main-content">
        <div className={`split-grid mobile-active-${activeTab}`}>
          {/* Left Column: Form Section */}
          <section className="scroll-panel form-panel">
            <div className="panel-header">
              <h2>Draft Details</h2>
              <p>Fill in the placeholders to generate your letter.</p>
            </div>

            <div className="form-container">
              <div className="input-group">
                <label>Your Full Name</label>
                <input type="text" id="senderName" value={formData.senderName} onChange={handleChange} placeholder="e.g. Rajesh Kumar" />
              </div>

              <div className="input-group">
                <label>Your Address</label>
                <textarea id="senderAddress" rows="2" value={formData.senderAddress} onChange={handleChange} placeholder="House No., Street, City, PIN" />
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label>Recipient Name/Title</label>
                  <input type="text" id="recipientName" value={formData.recipientName} onChange={handleChange} placeholder="e.g. Principal / Mr. Sharma" />
                </div>
                <div className="input-group">
                  <label>Date</label>
                  <input type="date" id="letterDate" value={formData.letterDate} onChange={handleChange} />
                </div>
              </div>

              <div className="input-group">
                <label>Recipient Address</label>
                <textarea id="recipientAddress" rows="2" value={formData.recipientAddress} onChange={handleChange} placeholder="Office/School Name, Address" />
              </div>

              <div className="input-group">
                <label>Template Category</label>
                <select id="letterType" value={formData.letterType} onChange={handleChange}>
                  <option value="apology">Apology Letter</option>
                  <option value="request">Formal Request</option>
                  <option value="complaint">Complaint Letter</option>
                  <option value="thanks">Thank You Note</option>
                </select>
              </div>

              <div className="input-group">
                <label>Subject / Reason</label>
                <input type="text" id="reason" value={formData.reason} onChange={handleChange} placeholder="e.g. regarding sick leave" />
              </div>

              <div className="input-group">
                <label>Additional Context (Optional)</label>
                <textarea id="details" rows="3" value={formData.details} onChange={handleChange} placeholder="Personalize the tone..." />
              </div>

              <div className="panel-actions">
                <button className="action-btn primary" onClick={() => { generateLetter(); if (window.innerWidth < 1100) setActiveTab('preview'); }}>✨ Update & View Preview</button>
                {generatedLetter && (
                  <button className="action-btn secondary" onClick={saveLetter}><SaveIcon /> Store in Cloud</button>
                )}
              </div>
            </div>

            {savedLetters.length > 0 && (
              <div className="library-section">
                <h3>Cloud Library</h3>
                <div className="history-grid">
                  {savedLetters.map(letter => (
                    <div key={letter.id} className="history-card-mini" onClick={() => loadLetter(letter)}>
                      <div className="category-tag">{letter.letterType}</div>
                      <div className="card-title">{letter.reason}</div>
                      <div className="card-date">{formatDate(letter.letterDate)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Right Column: Preview Panel */}
          <section className="sticky-panel preview-panel">
            <div className="panel-header flex-header">
              <h2>Live Preview</h2>
              {generatedLetter && (
                <button className="copy-action-btn" onClick={() => { navigator.clipboard.writeText(generatedLetter); alert('Copied!'); }}><CopyIcon /> Copy</button>
              )}
            </div>

            {!generatedLetter ? (
              <div className="empty-preview">
                <div className="empty-icon">📭</div>
                <p>Fill in the required fields to generate your letter.</p>
              </div>
            ) : (
              <div className="letter-paper-outer">
                <div className="letter-paper">
                  <div className="paper-texture"></div>
                  <div className="letter-content">{generatedLetter}</div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-left">
            <p className="copyright">© 2026 Indian Letter Gen. All rights reserved.</p>
          </div>
          <div className="footer-right">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-link" title="Instagram">
              <InstagramIcon />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-link" title="Twitter/X">
              <TwitterIcon />
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
