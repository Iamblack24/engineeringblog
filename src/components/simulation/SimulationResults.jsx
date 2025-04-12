import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';

const SimulationResults = ({ results }) => {
  const [activeTab, setActiveTab] = useState('analysis');
  
  if (!results) return null;

  return (
    <motion.div 
      className="results-container bg-white rounded-lg shadow-md overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="border-b">
        <div className="flex border-b">
          <button
            className={`py-3 px-6 text-sm font-medium transition-colors ${
              activeTab === 'analysis' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('analysis')}
          >
            Analysis
          </button>
          <button
            className={`py-3 px-6 text-sm font-medium transition-colors ${
              activeTab === 'export' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('export')}
          >
            Export & Share
          </button>
        </div>
      </div>
      
      <div className="p-4">
        {activeTab === 'analysis' && (
          <div className="prose max-w-none">
            <ReactMarkdown>{results}</ReactMarkdown>
          </div>
        )}
        
        {activeTab === 'export' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Export Options</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                className="flex items-center justify-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                onClick={() => {
                  // Here would be PDF export functionality
                  alert('PDF export functionality would be implemented here');
                }}
              >
                <span className="mr-2">
                  <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                </span>
                <span>PDF Report</span>
              </button>
              
              <button 
                className="flex items-center justify-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                onClick={() => {
                  // Here would be CSV export functionality
                  alert('CSV export functionality would be implemented here');
                }}
              >
                <span className="mr-2">
                  <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                  </svg>
                </span>
                <span>Data (CSV)</span>
              </button>
              
              <button 
                className="flex items-center justify-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                onClick={() => {
                  // Here would be link sharing functionality
                  alert('Share link functionality would be implemented here');
                }}
              >
                <span className="mr-2">
                  <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                  </svg>
                </span>
                <span>Share Link</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SimulationResults;