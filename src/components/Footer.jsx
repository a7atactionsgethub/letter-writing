import { InstagramIcon, LinkedInIcon } from './Icons';

export const Footer = () => (
  <footer className="compact-footer">
    <div className="footer-content-bar">
      <div className="footer-left-info">
        <p>© 2026 Letter Generator Pro</p>
        <p className="credit-text">Designed by <a href="https://www.instagram.com/a7_visuals/" target="_blank" rel="noopener noreferrer">A7 Visuals</a></p>
      </div>
      <div className="footer-right-actions">
        <a href="https://www.linkedin.com/in/aswina72010" target="_blank" rel="noopener noreferrer" className="social-link linkedin">
          <LinkedInIcon />
          <span>LinkedIn</span>
        </a>
        <a href="https://www.instagram.com/a7_visuals/" target="_blank" rel="noopener noreferrer" className="social-link insta">
          <InstagramIcon />
          <span>Instagram</span>
        </a>
      </div>
    </div>
  </footer>
);
