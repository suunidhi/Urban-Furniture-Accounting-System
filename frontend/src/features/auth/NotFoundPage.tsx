import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import urbanLogo from '../../assets/urban_logo.png';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <img src={urbanLogo} alt="Urban Furniture Logo" className="w-16 h-16 rounded-xl shadow-md object-cover mx-auto mb-6" />
        <h1 className="text-9xl font-black text-[#714B67] drop-shadow-sm">404</h1>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#2F2F2F]">
          Page Not Found
        </h2>
        <p className="mt-4 text-sm text-gray-500 max-w-md mx-auto">
          We're sorry, but the page you are looking for doesn't exist, has been removed, or is temporarily unavailable.
        </p>
        
        <div className="mt-8 flex justify-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 bg-[#714B67] text-white px-6 py-2.5 rounded-lg font-semibold shadow hover:bg-[#5a3a52] transition-colors"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};
