import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Database, 
  Sparkles, 
  Settings, 
  HelpCircle, 
  FileText,
  BarChart,
  Users
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  
  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
    { name: 'Data Cleaning', icon: <Database size={20} />, path: '/data-cleaning' },
    { name: 'Model Hub', icon: <Sparkles size={20} />, path: '/model-hub' },
    { name: 'Reports', icon: <FileText size={20} />, path: '/reports' },
    { name: 'Analytics', icon: <BarChart size={20} />, path: '/analytics' },
    { name: 'Team', icon: <Users size={20} />, path: '/team' },
    { name: 'Settings', icon: <Settings size={20} />, path: '/settings' },
    { name: 'Help & Support', icon: <HelpCircle size={20} />, path: '/help' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white shadow-md">
      <div className="flex flex-col flex-1 overflow-y-auto">
        <nav className="flex-1 px-2 py-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                  isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className={`mr-3 ${isActive ? 'text-blue-500' : 'text-gray-500'}`}>
                  {item.icon}
                </span>
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;