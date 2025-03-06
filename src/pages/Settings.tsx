import React, { useState } from 'react';
import { Save, User, Lock, Database, Bell, Globe, Sliders } from 'lucide-react';
import { useStore } from '../store';

const Settings = () => {
  const { user, updateUser } = useStore();
  
  const [generalSettings, setGeneralSettings] = useState({
    username: user?.name || '',
    email: user?.email || '',
    language: 'en',
    theme: 'light',
    notifications: {
      email: true,
      browser: true,
      mobile: false,
    }
  });

  const [dataSettings, setDataSettings] = useState({
    defaultFormat: 'csv',
    autoClean: true,
    saveHistory: true,
    maxHistoryItems: 50,
  });

  const [apiSettings, setApiSettings] = useState({
    huggingfaceApiKey: '••••••••••••••••',
    openaiApiKey: '••••••••••••••••',
    googleApiKey: '',
  });

  const handleGeneralSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setGeneralSettings(prev => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          [name.split('.')[1]]: checked
        }
      }));
    } else {
      setGeneralSettings(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleDataSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setDataSettings(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (type === 'number') {
      setDataSettings(prev => ({
        ...prev,
        [name]: parseInt(value)
      }));
    } else {
      setDataSettings(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleApiSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setApiSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveSettings = () => {
    // Update user in store
    updateUser({
      ...user,
      name: generalSettings.username,
      email: generalSettings.email,
    });
    
    // Show success message
    alert('Settings saved successfully!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <button 
          onClick={handleSaveSettings}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
        >
          <Save size={16} className="mr-2" />
          Save Changes
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { name: 'Account', icon: <User size={18} /> },
              { name: 'Data', icon: <Database size={18} /> },
              { name: 'API Keys', icon: <Lock size={18} /> },
              { name: 'Notifications', icon: <Bell size={18} /> },
              { name: 'Appearance', icon: <Sliders size={18} /> },
              { name: 'Language', icon: <Globe size={18} /> },
            ].map((tab, index) => (
              <button
                key={tab.name}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  index === 0
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          <div className="space-y-8">
            {/* Account Settings */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Account Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={generalSettings.username}
                    onChange={handleGeneralSettingsChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={generalSettings.email}
                    onChange={handleGeneralSettingsChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                    Language
                  </label>
                  <select
                    id="language"
                    name="language"
                    value={generalSettings.language}
                    onChange={handleGeneralSettingsChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="zh">Chinese</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="theme" className="block text-sm font-medium text-gray-700 mb-1">
                    Theme
                  </label>
                  <select
                    id="theme"
                    name="theme"
                    value={generalSettings.theme}
                    onChange={handleGeneralSettingsChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System Default</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Data Settings */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Data Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="defaultFormat" className="block text-sm font-medium text-gray-700 mb-1">
                    Default Export Format
                  </label>
                  <select
                    id="defaultFormat"
                    name="defaultFormat"
                    value={dataSettings.defaultFormat}
                    onChange={handleDataSettingsChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="csv">CSV</option>
                    <option value="json">JSON</option>
                    <option value="xlsx">Excel (XLSX)</option>
                    <option value="txt">Text (TXT)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="maxHistoryItems" className="block text-sm font-medium text-gray-700 mb-1">
                    Max History Items
                  </label>
                  <input
                    type="number"
                    id="maxHistoryItems"
                    name="maxHistoryItems"
                    min="10"
                    max="100"
                    value={dataSettings.maxHistoryItems}
                    onChange={handleDataSettingsChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="autoClean"
                    name="autoClean"
                    checked={dataSettings.autoClean}
                    onChange={handleDataSettingsChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="autoClean" className="ml-2 block text-sm text-gray-700">
                    Auto-clean data on import
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="saveHistory"
                    name="saveHistory"
                    checked={dataSettings.saveHistory}
                    onChange={handleDataSettingsChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="saveHistory" className="ml-2 block text-sm text-gray-700">
                    Save cleaning history
                  </label>
                </div>
              </div>
            </div>

            {/* API Keys */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">API Keys</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="huggingfaceApiKey" className="block text-sm font-medium text-gray-700 mb-1">
                    Hugging Face API Key
                  </label>
                  <input
                    type="password"
                    id="huggingfaceApiKey"
                    name="huggingfaceApiKey"
                    value={apiSettings.huggingfaceApiKey}
                    onChange={handleApiSettingsChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Used for accessing Hugging Face models. <a href="#" className="text-blue-600 hover:underline">Get a key</a>
                  </p>
                </div>
                <div>
                  <label htmlFor="openaiApiKey" className="block text-sm font-medium text-gray-700 mb-1">
                    OpenAI API Key
                  </label>
                  <input
                    type="password"
                    id="openaiApiKey"
                    name="openaiApiKey"
                    value={apiSettings.openaiApiKey}
                    onChange={handleApiSettingsChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Used for advanced text cleaning features. <a href="#" className="text-blue-600 hover:underline">Get a key</a>
                  </p>
                </div>
                <div>
                  <label htmlFor="googleApiKey" className="block text-sm font-medium text-gray-700 mb-1">
                    Google Cloud API Key (Optional)
                  </label>
                  <input
                    type="password"
                    id="googleApiKey"
                    name="googleApiKey"
                    value={apiSettings.googleApiKey}
                    onChange={handleApiSettingsChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Used for Google Cloud services integration. <a href="#" className="text-blue-600 hover:underline">Get a key</a>
                  </p>
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Notification Settings</h2>
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="notifications.email"
                    name="notifications.email"
                    checked={generalSettings.notifications.email}
                    onChange={handleGeneralSettingsChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="notifications.email" className="ml-2 block text-sm text-gray-700">
                    Email notifications
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="notifications.browser"
                    name="notifications.browser"
                    checked={generalSettings.notifications.browser}
                    onChange={handleGeneralSettingsChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="notifications.browser" className="ml-2 block text-sm text-gray-700">
                    Browser notifications
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="notifications.mobile"
                    name="notifications.mobile"
                    checked={generalSettings.notifications.mobile}
                    onChange={handleGeneralSettingsChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="notifications.mobile" className="ml-2 block text-sm text-gray-700">
                    Mobile push notifications
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;