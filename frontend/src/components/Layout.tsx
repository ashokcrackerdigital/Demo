import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-primary-600">
                🏥 Healthcare Booking
              </Link>
            </div>
            <nav className="flex space-x-4">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/')
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Home
              </Link>
              <Link
                to="/booking"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/booking')
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Book Appointment
              </Link>
              <Link
                to="/admin"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/admin')
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Admin
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-gray-600 text-sm">
            © 2024 Healthcare Booking App. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;

