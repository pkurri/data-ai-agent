import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-9xl font-bold text-blue-600">404</h1>
      <h2 className="text-3xl font-semibold text-gray-800 mt-4">Page Not Found</h2>
      <p className="text-gray-600 mt-2 max-w-md">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <div className="mt-8 flex space-x-4">
        <Link
          to="/"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
        >
          <Home size={18} className="mr-2" />
          Go Home
        </Link>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors flex items-center"
        >
          <ArrowLeft size={18} className="mr-2" />
          Go Back
        </button>
      </div>
    </div>
  );
};

export default NotFound;