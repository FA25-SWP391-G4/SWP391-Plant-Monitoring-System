// src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  
  const handleTermsClick = (e) => {
    e.preventDefault();
    window.location.href = '/terms';
  };

  const handlePrivacyClick = (e) => {
    e.preventDefault();
    window.location.href = '/privacy';
  };

  return (
    <footer className="bg-light-mode-bg dark:bg-dark-mode-bg text-light-mode-text dark:text-dark-mode-text py-4 border-t border-gray-200 dark:border-gray-700">
      <div className="container">
        <div className="row">
          <div className="col-md-6">
            <p className="mb-0">
              &copy; {currentYear} {t('common.appName')}. {t('landing.allRightsReserved', 'All rights reserved.')}
            </p>
          </div>
          <div className="col-md-6 text-md-end">
            <a href="/terms" onClick={handleTermsClick} className="text-decoration-none me-3">{t('footer.termsOfService')}</a>
            <a href="/privacy" onClick={handlePrivacyClick} className="text-decoration-none">{t('footer.privacyPolicy')}</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
