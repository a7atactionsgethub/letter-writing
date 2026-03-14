import { CustomSelect } from './CustomSelect';
import { SaveIcon } from './Icons';
import { SUBJECT_OPTIONS, TITLES, CATEGORIES } from '../constants/formConstants';

export const EditorWorkspace = ({ 
  formData, 
  handleChange, 
  setFormData, 
  handleManualGenerate, 
  generatedLetter, 
  saveLetter, 
  savedLetters, 
  loadLetter, 
  formatDate 
}) => {
  return (
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
        {formData.reason === "Custom..." && (
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
          <p>Define the sender and recipient contact info</p>
        </div>
        
        <div className="letter-grid-wrapper">
          {/* Sender Side */}
          <div className="letter-side-box">
            <h3 className="side-label">From: Sender Info</h3>
            <div className="control-group">
              <label>Full Legal Name</label>
              <input type="text" id="senderName" value={formData.senderName} onChange={handleChange} placeholder="John Doe" />
            </div>
            <div className="control-group">
              <label>Your Address</label>
              <textarea id="senderAddress" rows="3" value={formData.senderAddress} onChange={handleChange} placeholder="Street, City, State" />
            </div>
          </div>

          <div className="side-divider"></div>

          {/* Recipient Side */}
          <div className="letter-side-box">
            <h3 className="side-label">To: Recipient Info</h3>
            <div className="control-group">
              <label>Name & Title</label>
              <div className="split-input">
                <CustomSelect 
                  className="tiny-custom-select"
                  id="recipientTitle" 
                  value={formData.recipientTitle} 
                  options={TITLES} 
                  onChange={handleChange} 
                />
                <input type="text" id="recipientName" value={formData.recipientName} onChange={handleChange} placeholder="Recipient Name" />
              </div>
            </div>
            <div className="control-group">
              <label>Recipient Address</label>
              <textarea id="recipientAddress" rows="3" value={formData.recipientAddress} onChange={handleChange} placeholder="Full Address" />
            </div>
          </div>
        </div>

        <div className="context-divider"></div>

        <div className="control-group full-width mt-1-5">
          <label>Additional Context (Optional)</label>
          <textarea id="details" rows="3" value={formData.details} onChange={handleChange} placeholder="Describe any specific context to include in the letter..." />
        </div>

        <div className="form-actions-pretty">
          <button className="btn-solid" onClick={handleManualGenerate}>
            Generate & Preview Letter
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
  );
};
