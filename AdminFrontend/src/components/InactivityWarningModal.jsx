import React from 'react';

const InactivityWarningModal = ({ onStayLoggedIn }) => {
  return (
    <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded shadow-md text-center max-w-sm">
        <p className="mb-4 font-semibold">You’ve been inactive</p>
        <p className="mb-4 text-sm">
          You’ll be logged out in 1 minute unless activity is detected.
        </p>
        <button
          onClick={onStayLoggedIn}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Stay Logged In
        </button>
      </div>
    </div>
  );
};

export default InactivityWarningModal;
