// src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-light py-4 mt-auto">
      <div className="container">
        <div className="row">
          <div className="col-md-6">
            <p className="mb-0">
              &copy; {currentYear} Plant Monitoring System. All rights reserved.
            </p>
          </div>
          <div className="col-md-6 text-md-end">
            <Link to="/terms" className="text-decoration-none me-3">Terms of Service</Link>
            <Link to="/privacy" className="text-decoration-none">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
