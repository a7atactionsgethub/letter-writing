import { SettingsIcon, LogoutIcon, SunIcon, MoonIcon } from './Icons';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

export const Navbar = ({ 
  user, 
  profile, 
  setProfile,
  showUserMenu, 
  setShowUserMenu, 
  showSettings, 
  setShowSettings, 
  menuRef, 
  handleProfileUpdate,
  theme,
  toggleTheme
}) => {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand">
          <div className="brand-dot"></div>
          <h1>Letter Generator Pro</h1>
        </div>
        
        <div className="navbar-actions" ref={menuRef}>
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>

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
                <div className="settings-panel">
                  <div className="settings-header">
                    <button className="back-btn" onClick={() => setShowSettings(false)}>
                      ← Back
                    </button>
                    <h4>User Settings</h4>
                  </div>
                  <div className="settings-form">
                    <div className="control-group">
                      <label>Preferred Legal Name</label>
                      <input 
                        type="text" 
                        value={profile.preferredName} 
                        onChange={(e) => setProfile({ ...profile, preferredName: e.target.value })}
                        placeholder="e.g. John Doe"
                      />
                      <p className="hint-text">This will be used to auto-fill the "Your Name" field in letters.</p>
                    </div>
                    <button className="btn-solid tiny-btn" onClick={handleProfileUpdate}>
                      Update Profile
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
