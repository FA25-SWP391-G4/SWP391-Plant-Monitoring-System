/**
 * Demo Page
 * Interactive demo of the PlantSmart dashboard
 */
'use client'

import { useEffect, useState } from 'react';
import DemoLayout from '../../components/DemoLayout';

const DemoPage = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Simulate loading time for demo effect
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading demo...</p>
        </div>
      </div>
    );
  }

  return (
    <DemoLayout>
      {/* Additional demo content can be added here */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plant Health Chart Demo */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Plant Health Trends</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Weekly health monitoring</p>
          </div>
          <div className="p-6">
            <div className="h-48 flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="text-center">
                <div className="inline-block p-3 bg-green-100 dark:bg-green-900 rounded-full mb-3">
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-gray-600 dark:text-gray-400">Interactive charts available in full version</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Demo */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Latest system events</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-white">Snake Plant watered automatically</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-white">Low battery alert for Sensor #3</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">15 minutes ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-white">Monstera health improved to Excellent</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">1 hour ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-white">New device added: Light Sensor #5</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">3 hours ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Preview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-green-500 rounded-lg mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Smart Automation</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Automated watering schedules and climate control based on plant needs and environmental conditions.</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-500 rounded-lg mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">AI Plant Care</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Advanced AI analysis provides personalized care recommendations and early problem detection.</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-purple-500 rounded-lg mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Mobile Control</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Control your plants from anywhere with our mobile app and real-time notifications.</p>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Ready to Transform Your Plant Care?</h2>
        <p className="text-green-100 mb-6 max-w-2xl mx-auto">
          Join thousands of plant enthusiasts who have revolutionized their gardening with PlantSmart's intelligent monitoring system.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition">
            Start Free Trial
          </button>
          <button className="bg-green-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-800 transition">
            View Pricing
          </button>
        </div>
      </div>
    </DemoLayout>
  );
};

export default DemoPage;