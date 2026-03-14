export const AuthLayout = ({ children }) => (
  <div className="app-root auth-page-layout">
    <div className="app-bg-mesh"></div>
    <div className="glow-orb" style={{ top: '10%', left: '10%' }}></div>
    <div className="glow-orb" style={{ bottom: '10%', right: '10%', opacity: 0.2 }}></div>
    
    <div className="auth-container">
      <div className="glass-card auth-card">
        {children}
      </div>
    </div>
  </div>
);
