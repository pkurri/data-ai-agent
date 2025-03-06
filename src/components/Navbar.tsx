import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, MessageSquare, Search, Menu, X } from 'lucide-react';
import { useStore } from '../store';

const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useStore();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button 
              className="md:hidden mr-2"
              onClick={toggleMobileMenu}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold">DataCleanr</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-300" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 rounded-full bg-blue-500 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white"
                placeholder="Search data, models, or tasks..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button className="p-1 rounded-full hover:bg-blue-500 focus:outline-none">
              <Bell size={20} />
            </button>
            <button className="p-1 rounded-full hover:bg-blue-500 focus:outline-none">
              <MessageSquare size={20} />
            </button>
            <div className="flex items-center">
              <img
                className="h-8 w-8 rounded-full border-2 border-white"
                src={user?.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"}
                alt="User avatar"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile search - shown when menu is open */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pb-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-300" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 rounded-full bg-blue-500 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white"
              placeholder="Search..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;