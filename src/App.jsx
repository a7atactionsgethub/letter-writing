import { useState, useEffect, useCallback } from 'react'
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
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLogin, setIsLogin] = useState(true);
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
      <header className="app-header">
        <div className="logo-section">
          <span className="logo-icon">📝</span>
          <div>
            <h1>Indian Letter Gen</h1>
            <p className="tagline">Professional correspondence, simplified.</p>
          </div>
        </div>
        
        <div className="header-actions">
          <div className="user-pill">
            <div className="mini-avatar">{(user.displayName || user.email)[0].toUpperCase()}</div>
            <span className="user-name">{user.displayName || user.email.split('@')[0]}</span>
          </div>
          <button className="icon-btn logout-btn" onClick={() => signOut(auth)} title="Logout">
            <LogoutIcon />
          </button>
        </div>
      </header>

      <main className="main-content">
        <div className="split-grid">
          {/* Left Column: Form Section */}
          <section className="scroll-panel form-panel">
            <div className="panel-header">
              <h2>Draft Details</h2>
              <p>Fill in the placeholders to generate your letter.</p>
            </div>

            <div className="form-container">
              <div className="input-row">
                <div className="input-group">
                  <label>Your Full Name</label>
                  <input type="text" id="senderName" value={formData.senderName} onChange={handleChange} placeholder="e.g. Rajesh Kumar" />
                </div>
              </div>

              <div className="input-group">
                <label>Your Address</label>
                <textarea id="senderAddress" rows="2" value={formData.senderAddress} onChange={handleChange} placeholder="House No., Street, City, PIN" />
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label>Recipient Name/Title</label>
                  <input type="text" id="recipientName" value={formData.recipientName} onChange={handleChange} placeholder="e.g. The Principal / Mr. Sharma" />
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
                <input type="text" id="reason" value={formData.reason} onChange={handleChange} placeholder="e.g. regarding sick leave / apology for delay" />
              </div>

              <div className="input-group">
                <label>Additional Context (Optional)</label>
                <textarea id="details" rows="3" value={formData.details} onChange={handleChange} placeholder="Provide specific details to personalize the tone..." />
              </div>

              <div className="panel-actions">
                <button className="action-btn primary" onClick={generateLetter}>
                   ✨ Refresh Preview
                </button>
                {generatedLetter && (
                  <button className="action-btn secondary" onClick={saveLetter}>
                    <SaveIcon /> Store in Cloud
                  </button>
                )}
              </div>
            </div>

            {/* History Section Integrated in Left Column */}
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
                <button className="copy-action-btn" onClick={() => {
                  navigator.clipboard.writeText(generatedLetter);
                  alert('Copied to clipboard!');
                }}>
                  <CopyIcon /> Copy
                </button>
              )}
            </div>

            {!generatedLetter ? (
              <div className="empty-preview">
                <div className="empty-icon">📭</div>
                <p>Fill in the required fields to see your professional letter appear here.</p>
              </div>
            ) : (
              <div className="letter-paper-outer">
                <div className="letter-paper">
                  <div className="paper-texture"></div>
                  <div className="letter-content">
                    {generatedLetter}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

export default App
