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
      <p>Syncing your profile...</p>
    </div>
  );

  if (!user) return <Auth isLogin={isLogin} onToggleMode={() => setIsLogin(!isLogin)} />;

  return (
    <div className="app-shell">
      <header className="main-header">
        <div className="header-content">
          <div className="brand-logo">
            <span className="logo-box">📝</span>
            <div>
              <h1>Letter Generator Pro</h1>
              <p className="sub-branding">Professional Dashboard</p>
            </div>
          </div>
          
          <div className="profile-area" ref={menuRef}>
            <button className={`profile-trigger ${showUserMenu ? 'active' : ''}`} onClick={() => setShowUserMenu(!showUserMenu)}>
              <div className="avatar-dot">{(user.displayName || user.email)[0].toUpperCase()}</div>
              <span className="profile-name">{user.displayName || user.email.split('@')[0]}</span>
              <svg className={`chevron-icon ${showUserMenu ? 'up' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
            
            {showUserMenu && (
              <div className="dropdown-panel">
                <div className="panel-user-info">
                  <div className="avatar-large-circle">{(user.displayName || user.email)[0].toUpperCase()}</div>
                  <div className="user-meta">
                    <p className="meta-name">{user.displayName || user.email.split('@')[0]}</p>
                    <p className="meta-email">{user.email}</p>
                  </div>
                </div>
                <div className="panel-actions-list">
                  <button className="panel-btn logout-danger" onClick={() => signOut(auth)}>
                    <LogoutIcon /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Tab Switcher */}
      <nav className="tab-navigation">
        <div className="tab-switcher">
          <button 
            className={`view-tab ${activeTab === 'edit' ? 'active' : ''}`} 
            onClick={() => setActiveTab('edit')}
          >
            <span>Draft Editor</span>
          </button>
          <button 
            className={`view-tab ${activeTab === 'preview' ? 'active' : ''}`} 
            onClick={() => {
              generateLetter();
              setActiveTab('preview');
            }}
            disabled={!generatedLetter}
          >
            <span>Live Preview</span>
          </button>
        </div>
      </nav>

      <main className="tab-content-area">
        {activeTab === 'edit' ? (
          <div className="editor-view animation-fade">
            <section className="config-card">
              <div className="card-header">
                <h3>1. Configuration</h3>
                <p>Define the type and purpose of your letter.</p>
              </div>
              <div className="config-grid">
                <div className="field-group">
                  <label>Letter Category</label>
                  <select id="letterType" value={formData.letterType} onChange={handleChange}>
                    <option value="apology">Apology Letter</option>
                    <option value="request">Formal Request</option>
                    <option value="complaint">Complaint Letter</option>
                    <option value="thanks">Thank You Note</option>
                  </select>
                </div>
                <div className="field-group">
                  <label>Date</label>
                  <input type="date" id="letterDate" value={formData.letterDate} onChange={handleChange} />
                </div>
                <div className="field-group">
                  <label>Subject / Reason</label>
                  <select id="reason" value={formData.reason} onChange={handleChange}>
                    {SUBJECT_OPTIONS[formData.letterType].map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
              {formData.reason === 'Custom...' && (
                <div className="field-group mt-1">
                  <input
                    type="text"
                    id="customReason"
                    placeholder="Enter custom subject..."
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  />
                </div>
              )}
            </section>

            <section className="config-card">
              <div className="card-header">
                <h3>2. Recipient & Sender</h3>
                <p>Provide the specific details for the letter body.</p>
              </div>
              <div className="editor-grid">
                <div className="field-group">
                  <label>Your Full Name</label>
                  <input type="text" id="senderName" value={formData.senderName} onChange={handleChange} placeholder="Rajesh Kumar" />
                </div>
                <div className="field-group">
                  <label>Recipient Title & Name</label>
                  <div className="dual-input">
                    <select className="title-select" id="recipientTitle" value={formData.recipientTitle} onChange={handleChange}>
                      {TITLES.map(title => <option key={title} value={title}>{title}</option>)}
                    </select>
                    <input type="text" id="recipientName" value={formData.recipientName} onChange={handleChange} placeholder="John Doe" />
                  </div>
                </div>
                <div className="field-group">
                  <label>Your Address</label>
                  <textarea id="senderAddress" rows="2" value={formData.senderAddress} onChange={handleChange} placeholder="House No., Street, City, PIN" />
                </div>
                <div className="field-group">
                  <label>Recipient Address</label>
                  <textarea id="recipientAddress" rows="2" value={formData.recipientAddress} onChange={handleChange} placeholder="Office/School Name, Address" />
                </div>
                <div className="field-group full-span">
                  <label>Personalized Message / Context (Optional)</label>
                  <textarea id="details" rows="3" value={formData.details} onChange={handleChange} placeholder="Add specific context to make your letter unique..." />
                </div>
              </div>
              <div className="card-actions">
                <button className="main-btn primary-glow" onClick={() => {
                  generateLetter();
                  setActiveTab('preview');
                }}>
                  View Live Preview
                </button>
                {generatedLetter && (
                  <button className="main-btn secondary-dim" onClick={saveLetter}>
                    <SaveIcon /> Cloud Save
                  </button>
                )}
              </div>
            </section>

            {savedLetters.length > 0 && (
              <section className="history-section config-card">
                <div className="card-header">
                  <h3>Cloud History</h3>
                </div>
                <div className="history-list">
                  {savedLetters.map(letter => (
                    <div key={letter.id} className="letter-card-item" onClick={() => loadLetter(letter)}>
                      <div className="item-meta">
                        <span className="type-badge">{letter.letterType}</span>
                        <span className="date-text">{formatDate(letter.letterDate)}</span>
                      </div>
                      <h4 className="item-title">{letter.reason}</h4>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="preview-view animation-fade">
            <div className="preview-sticky-header">
              <div className="preview-info">
                <h3>Draft Preview</h3>
                <p>Verify your letter before formal submission.</p>
              </div>
              <button className="copy-action-btn" onClick={() => {
                navigator.clipboard.writeText(generatedLetter);
                alert('Copied!');
              }}>
                <CopyIcon /> Copy Document
              </button>
            </div>
            
            <div className="document-container">
              <div className="document-sheet">
                <div className="paper-grain"></div>
                <div className="letter-text-body">
                  {generatedLetter}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="footer-professional">
        <div className="footer-inner">
          <div className="footer-branding">
            <p>© 2026 Letter Generator Pro</p>
            <p className="design-credit">Designed & Developed by <a href="https://www.instagram.com/a7_visuals/" target="_blank" rel="noopener noreferrer">A7 Visuals</a></p>
          </div>
          <div className="footer-social">
            <a href="https://www.instagram.com/a7_visuals/" target="_blank" rel="noopener noreferrer" className="social-pill">
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
