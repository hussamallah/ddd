'use client';

import { useEffect } from 'react';

// Extend Window interface to include clarity property
declare global {
  interface Window {
    clarity?: (command: string, ...args: any[]) => void;
  }
}

export default function TestClarityPage() {
  useEffect(() => {
    // Test if Clarity is loaded
    if (typeof window !== 'undefined') {
      console.log('Testing Clarity installation...');
      
      // Check if clarity function exists
      if (window.clarity) {
        console.log('✅ Clarity is loaded and working!');
        console.log('Clarity function:', window.clarity);
        
        // Try to send a test event
        try {
          window.clarity('set', 'test_page', 'clarity_test');
          console.log('✅ Clarity test event sent successfully');
        } catch (error) {
          console.error('❌ Error sending Clarity test event:', error);
        }
      } else {
        console.log('❌ Clarity is NOT loaded');
        console.log('Window object keys:', Object.keys(window));
        console.log('Available global functions:', Object.getOwnPropertyNames(window));
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-4">Clarity Test Page</h1>
      <p className="mb-4">This page is testing if Microsoft Clarity is working properly.</p>
      
      <div className="bg-gray-800 p-4 rounded">
        <h2 className="text-xl font-semibold mb-2">Instructions:</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Open your browser's Developer Tools (F12)</li>
          <li>Go to the Console tab</li>
          <li>Look for Clarity-related messages</li>
          <li>Check if there are any error messages</li>
        </ol>
      </div>
      
      <div className="mt-6 bg-gray-800 p-4 rounded">
        <h2 className="text-xl font-semibold mb-2">Expected Console Output:</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>✅ "Testing Clarity installation..."</li>
          <li>✅ "Clarity is loaded and working!"</li>
          <li>✅ "Clarity test event sent successfully"</li>
        </ul>
      </div>
      
      <div className="mt-6 bg-gray-800 p-4 rounded">
        <h2 className="text-xl font-semibold mb-2">If Clarity is NOT working:</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Check if the tracking code is properly installed in layout.tsx</li>
          <li>Verify that enableTracking is set to true</li>
          <li>Check for any JavaScript errors in the console</li>
          <li>Ensure the development server is running</li>
        </ul>
      </div>
    </div>
  );
}
