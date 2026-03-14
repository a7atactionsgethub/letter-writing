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
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const SUBJECT_OPTIONS = {
  apology: ["Late arrival to office/school", "Missing an important deadline", "Inappropriate behavior", "Errors in submitted work", "Custom..."],
  request: ["Leave of absence application", "Request for recommendation letter", "Meeting appointment request", "Resource/Equipment request", "Custom..."],
  complaint: ["Service delay complaint", "Poor quality of products", "Inadequate facilities", "Staff behavior issue", "Custom..."],
  thanks: ["Appreciation for guidance", "Thank you for the opportunity", "Acknowledgment of support", "Personal thank you note", "Custom..."]
};

const TITLES = ["Mr.", "Ms.", "Dr.", "Prof.", "The Principal", "The Manager", "Custom..."];

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLogin, setIsLogin] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('edit'); // 'edit' or 'preview'
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
    setFormData(prev => {
      const newData = { ...prev, [id]: value };
      if (id === 'letterType') newData.reason = SUBJECT_OPTIONS[value][0];
      return newData;
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const generateLetter = useCallback(() => {
    const { senderName, senderAddress, recipientTitle, recipientName, recipientAddress, letterDate, letterType, reason, details } = formData;
    if (!senderName || !senderAddress || !recipientName || !recipientAddress || !reason) return;

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
              <span className="profile-text">{user.displayName || user.email.split('@')[0]}</span>
              <svg className={`chevron-svg ${showUserMenu ? 'rotate' : ''}`} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
            
            {showUserMenu && (
              <div className="popover-menu">
                <div className="popover-user">
                  <div className="popover-avatar">{(user.displayName || user.email)[0].toUpperCase()}</div>
                  <div className="popover-meta">
                    <p className="p-name">{user.displayName || user.email.split('@')[0]}</p>
                    <p className="p-email">{user.email}</p>
                  </div>
                </div>
                <div className="popover-links">
                  <button className="popover-btn logout-link" onClick={() => signOut(auth)}>
                    <LogoutIcon /> Sign Out
                  </button>
                </div>
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
            onClick={() => {
              generateLetter();
              setActiveTab('preview');
            }}
            disabled={!generatedLetter}
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
                  <select id="letterType" value={formData.letterType} onChange={handleChange}>
                    <option value="apology">Apology</option>
                    <option value="request">Request</option>
                    <option value="complaint">Complaint</option>
                    <option value="thanks">Thanks</option>
                  </select>
                </div>
                <div className="control-group">
                  <label>Date</label>
                  <input type="date" id="letterDate" value={formData.letterDate} onChange={handleChange} />
                </div>
                <div className="control-group">
                  <label>Subject</label>
                  <select id="reason" value={formData.reason} onChange={handleChange}>
                    {SUBJECT_OPTIONS[formData.letterType].map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
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
                  <input type="text" id="senderName" value={formData.senderName} onChange={handleChange} placeholder="Rajesh Kumar" />
                </div>
                <div className="control-group">
                  <label>Recipient Name</label>
                  <div className="split-input">
                    <select className="tiny-select" id="recipientTitle" value={formData.recipientTitle} onChange={handleChange}>
                      {TITLES.map(title => <option key={title} value={title}>{title}</option>)}
                    </select>
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
                <button className="btn-solid" onClick={() => {
                  generateLetter();
                  setActiveTab('preview');
                }}>
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
