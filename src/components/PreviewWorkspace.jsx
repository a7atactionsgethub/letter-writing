import { CopyIcon, InfoIcon } from './Icons';

export const PreviewWorkspace = ({ generatedLetter, setActiveTab }) => {
  return (
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
  );
};
