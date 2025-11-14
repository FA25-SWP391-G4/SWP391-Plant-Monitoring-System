// src/components/Footer.jsx
import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-light py-4 mt-auto">
      <div className="container">
        <div className="row">
          <div className="col-md-6">
            <p className="mb-0">
              &copy; {currentYear} {t('common.appName')}. {t('landing.allRightsReserved', 'All rights reserved.')}
            </p>
          </div>
          <div className="col-md-6 text-md-end">
            <Link href="/terms" className="text-decoration-none me-3">{t('footer.termsOfService')}</Link>
            <Link href="/privacy" className="text-decoration-none">{t('footer.privacyPolicy')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
