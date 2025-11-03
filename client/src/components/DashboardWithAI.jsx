import React from 'react';
import AIChatbotPopup from './AIChatbotPopup';
import AIFeaturesSection from './AIFeaturesSection';

const DashboardWithAI = ({ children }) => {
  return (
    <div className="min-h-screen bg-app-gradient">
      {/* Main Dashboard Content */}
      <div className="container mx-auto px-4 py-6">
        {children}
        
        {/* AI Features Section */}
        <div className="mt-8">
          <AIFeaturesSection />
        </div>
      </div>
      
      {/* AI Chatbot Popup - Always available */}
      <AIChatbotPopup />
    </div>
  );
};

export default DashboardWithAI;