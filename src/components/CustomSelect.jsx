import { useState, useEffect, useRef } from 'react';

export const CustomSelect = ({ id, value, onChange, options, className = "", displayValue }) => {
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
        tabIndex="0"
        onKeyDown={(e) => e.key === 'Enter' && setIsOpen(!isOpen)}
      >
        <span className="selected-value">{displayValue || value || "Select Option"}</span>
        <svg className={`chevron-select ${isOpen ? 'rotate' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
      
      {isOpen && (
        <div className="custom-select-options">
          {options.map((option) => {
            const label = typeof option === 'string' ? option : option.label;
            const optId = typeof option === 'string' ? option : option.id;
            return (
              <div 
                key={optId} 
                className={`custom-select-option ${value === optId ? 'selected' : ''}`}
                onClick={() => {
                  onChange({ target: { id, value: optId } });
                  setIsOpen(false);
                }}
              >
                {label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
