import { useState, useEffect } from 'react'
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
  const [formData, setFormData] = useState({
    senderName: 'Rajesh Kumar',
    senderAddress: 'H.No. 123, Gali No. 5\nNew Delhi - 110001',
    recipientName: 'Mr. Sharma',
    recipientAddress: 'The Principal\nDelhi Public School\nNew Delhi',
    letterDate: new Date().toISOString().split('T')[0],
    letterType: 'apology',
    reason: 'not wearing shoes in school',
    details: 'I forgot them at home and realized too late.'
  });

  const [generatedLetter, setGeneratedLetter] = useState('');

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

  const copyToClipboard = () => {
    if (generatedLetter) {
      navigator.clipboard.writeText(generatedLetter)
        .then(() => alert('Letter copied to clipboard!'))
        .catch(() => alert('Failed to copy.'));
    }
  };

  useEffect(() => {
    generateLetter();
  }, []);

  return (
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

      <button className="primary-btn" onClick={generateLetter}>📄 Generate Professional Letter</button>

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
  )
}

export default App
