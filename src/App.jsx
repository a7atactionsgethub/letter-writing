import { useState, useEffect } from 'react'
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
import './index.css'

const templates = {
  apology: `{senderName}
{senderAddress}

Date: {date}

To,
{recipientName}
{recipientAddress}

Subject: Apology for {reason}

Respected {recipientName},

I am writing to sincerely apologize for {reason}. {details} I understand that my actions were inappropriate, and I assure you that I will take care to avoid such incidents in the future.

Thank you for your understanding.

Yours sincerely,
{senderName}`,

  request: `{senderName}
{senderAddress}

Date: {date}

To,
{recipientName}
{recipientAddress}

Subject: Request regarding {reason}

Respected {recipientName},

I hope this letter finds you well. I am writing to request {reason}. {details} I would greatly appreciate your consideration and look forward to your positive response.

Thank you for your time.

Yours sincerely,
{senderName}`,

  complaint: `{senderName}
{senderAddress}

Date: {date}

To,
{recipientName}
{recipientAddress}

Subject: Complaint about {reason}

Respected {recipientName},

I am writing to express my disappointment regarding {reason}. {details} I kindly request that you address this matter at your earliest convenience.

Thank you for your attention.

Yours sincerely,
{senderName}`,

  thanks: `{senderName}
{senderAddress}

Date: {date}

To,
{recipientName}
{recipientAddress}

Subject: Thank you for {reason}

Respected {recipientName},

I am writing to thank you for {reason}. {details} Your kindness and support mean a great deal to me.

With appreciation,
{senderName}`
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
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

  // Handle Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      // Prefill sender name from user profile if available
      if (currentUser && !formData.senderName) {
        setFormData(prev => ({ ...prev, senderName: currentUser.displayName || '' }));
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch Saved Letters
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'letters'), 
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const letters = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSavedLetters(letters);
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

  const generateLetter = () => {
    const { senderName, senderAddress, recipientName, recipientAddress, letterDate, letterType, reason, details } = formData;

    if (!senderName || !senderAddress || !recipientName || !recipientAddress || !reason) {
      alert('Please fill in all required fields (marked with *).');
      return;
    }

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
  };

  const saveLetter = async () => {
    if (!user) return;
    if (!generatedLetter) {
      alert('Generate a letter first!');
      return;
    }

    try {
      await addDoc(collection(db, 'letters'), {
        ...formData,
        content: generatedLetter,
        userId: user.uid,
        createdAt: serverTimestamp()
      });
      alert('Letter saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Error saving letter: ' + err.message);
    }
  };

  const loadLetter = (letter) => {
    const { content, createdAt, userId, id, ...rest } = letter;
    setFormData(rest);
    setGeneratedLetter(content);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const copyToClipboard = () => {
    if (generatedLetter) {
      navigator.clipboard.writeText(generatedLetter)
        .then(() => alert('Letter copied to clipboard!'))
        .catch(() => alert('Failed to copy.'));
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) return (
    <div className="glass-card" style={{textAlign: 'center', padding: '5rem'}}>
      <div className="subtitle">Loading session...</div>
    </div>
  );

  if (!user) return <Auth />;

  return (
    <>
      <div className="user-nav">
        <div className="user-info">
          <div className="avatar">{user.email[0].toUpperCase()}</div>
          <div>
            <div style={{fontWeight: 700}}>{user.displayName || user.email.split('@')[0]}</div>
            <div style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>{user.email}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>

      <div className="glass-card">
        <h1>🇮🇳 Indian Letter Generator</h1>
        <p className="subtitle">Craft professional letters in seconds with perfect formatting.</p>

        <div className="form-grid">
          <div className="input-group full-width">
            <label>Your Full Name *</label>
            <input type="text" id="senderName" value={formData.senderName} onChange={handleChange} placeholder="Rajesh Kumar" />
          </div>
          <div className="input-group full-width">
            <label>Your Address *</label>
            <textarea id="senderAddress" rows="2" value={formData.senderAddress} onChange={handleChange} placeholder="House No., Street, City, PIN" />
          </div>

          <div className="input-group full-width">
            <label>Recipient Name *</label>
            <input type="text" id="recipientName" value={formData.recipientName} onChange={handleChange} placeholder="Mr. Sharma" />
          </div>
          <div className="input-group full-width">
            <label>Recipient Address *</label>
            <textarea id="recipientAddress" rows="2" value={formData.recipientAddress} onChange={handleChange} placeholder="Office/School, Address" />
          </div>

          <div className="input-group">
            <label>Date *</label>
            <input type="date" id="letterDate" value={formData.letterDate} onChange={handleChange} />
          </div>
          <div className="input-group">
            <label>Letter Type *</label>
            <select id="letterType" value={formData.letterType} onChange={handleChange}>
              <option value="apology">Apology</option>
              <option value="request">Request</option>
              <option value="complaint">Complaint</option>
              <option value="thanks">Thank You</option>
            </select>
          </div>

          <div className="input-group full-width">
            <label>Subject / Reason *</label>
            <input type="text" id="reason" value={formData.reason} onChange={handleChange} placeholder="e.g., Not wearing shoes in school" />
          </div>

          <div className="input-group full-width">
            <label>Additional details (optional)</label>
            <textarea id="details" rows="3" value={formData.details} onChange={handleChange} placeholder="Explain briefly..." />
          </div>
        </div>

        <div style={{display: 'flex', gap: '1rem'}}>
          <button className="primary-btn" onClick={generateLetter}>📄 Generate Letter</button>
          {generatedLetter && (
            <button className="primary-btn" style={{background: 'var(--card-bg)', border: '1px solid var(--primary)'}} onClick={saveLetter}>
              💾 Save to Cloud
            </button>
          )}
        </div>

        {generatedLetter && (
          <div className="output-container">
            <div className="output-header">
              <h3>Preview Your Letter</h3>
              <button className="copy-btn" onClick={copyToClipboard}>
                📋 Copy to Clipboard
              </button>
            </div>
            <div className="letter-canvas">
              {generatedLetter}
            </div>
          </div>
        )}
      </div>

      {savedLetters.length > 0 && (
        <div className="history-card">
          <h3>Your Saved Letters</h3>
          <div className="history-list">
            {savedLetters.map(letter => (
              <div key={letter.id} className="history-item" onClick={() => loadLetter(letter)}>
                <div className="history-meta">
                  <h4>{letter.letterType.charAt(0).toUpperCase() + letter.letterType.slice(1)}: {letter.reason}</h4>
                  <span>Sent to {letter.recipientName} on {formatDate(letter.letterDate)}</span>
                </div>
                <div style={{color: 'var(--primary)', fontWeight: 700}}>Load ➜</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

export default App
