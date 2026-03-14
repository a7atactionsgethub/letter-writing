import { InstagramIcon, LinkedInIcon } from './Icons';
import { APP_VERSION } from '../constants/version';

export const Footer = () => (
  <footer className="compact-footer">
    <div className="footer-content-bar">
      <div className="footer-left-info">
        <div className="footer-meta">
          <p>© 2026 Letter Generator Pro</p>
          <div className="footer-meta-dot"></div>
          <span className="version-badge">v{APP_VERSION}</span>
        </div>
      </div>
      <div className="footer-right-actions">
        <a href="https://www.linkedin.com/in/aswina72010" target="_blank" rel="noopener noreferrer" className="social-link linkedin">
          <LinkedInIcon />
          <span>LinkedIn</span>
        </a>
        <a href="https://www.instagram.com/a7_visuals/" target="_blank" rel="noopener noreferrer" className="social-link insta">
          <InstagramIcon />
          <span>A7 Visuals</span>
        </a>
      </div>
    </div>
  </footer>
);
