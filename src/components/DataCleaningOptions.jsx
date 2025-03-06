import React, { useState } from 'react';
import { Check, AlertCircle, Sliders } from 'lucide-react';

const DataCleaningOptions = ({ onApplyOptions, initialOptions, disabled }) => {
  const [options, setOptions] = useState({
    removeDuplicates: initialOptions?.removeDuplicates ?? true,
    handleMissingValues: initialOptions?.handleMissingValues ?? 'impute',
    normalizeText: initialOptions?.normalizeText ?? true,
    detectOutliers: initialOptions?.detectOutliers ?? true,
    fixTypos: initialOptions?.fixTypos ?? false,
    ...initialOptions
  });

  const handleOptionChange = (option, value) => {
    setOptions(prev => ({
      ...prev,
      [option]: value
    }));
  };

  const handleApply = () => {
    if (onApplyOptions) {
      onApplyOptions(options);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Cleaning Options</h2>
        <Sliders className="h-5 w-5 text-gray-500" />
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center">
          <input
            id="removeDuplicates"
            type="checkbox"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            checked={options.removeDuplicates}
            onChange={(e) => handleOptionChange('removeDuplicates', e.target.checked)}
            disabled={disabled}
          />
          <label htmlFor="removeDuplicates" className="ml-2 block text-sm text-gray-700">
            Remove duplicate entries
          </label>
        </div>

        <div>
          <label htmlFor="missingValues" className="block text-sm text-gray-700 mb-1">
            Handle missing values
          </label>
          <select
            id="missingValues"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            value={options.handleMissingValues}
            onChange={(e) => handleOptionChange('handleMissingValues', e.target.value)}
            disabled={disabled}
          >
            <option value="impute">Impute with mean/mode</option>
            <option value="remove">Remove rows with missing values</option>
            <option value="fill">Fill with custom value</option>
          </select>
        </div>

        <div className="flex items-center">
          <input
            id="normalizeText"
            type="checkbox"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            checked={options.normalizeText}
            onChange={(e) => handleOptionChange('normalizeText', e.target.checked)}
            disabled={disabled}
          />
          <label htmlFor="normalizeText" className="ml-2 block text-sm text-gray-700">
            Normalize text (lowercase, remove extra spaces)
          </label>
        </div>

        <div className="flex items-center">
          <input
            id="detectOutliers"
            type="checkbox"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            checked={options.detectOutliers}
            onChange={(e) => handleOptionChange('detectOutliers', e.target.checked)}
            disabled={disabled}
          />
          <label htmlFor="detectOutliers" className="ml-2 block text-sm text-gray-700">
            Detect and handle outliers
          </label>
        </div>

        <div className="flex items-center">
          <input
            id="fixTypos"
            type="checkbox"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            checked={options.fixTypos}
            onChange={(e) => handleOptionChange('fixTypos', e.target.checked)}
            disabled={disabled}
          />
          <label htmlFor="fixTypos" className="ml-2 block text-sm text-gray-700 flex items-center">
            <span>Fix typos using NLP models</span>
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
              Hugging Face
            </span>
          </label>
        </div>
        
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Important Note</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Some options may significantly impact your data. Make sure to review the changes after cleaning.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-5">
        <button
          onClick={handleApply}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={disabled}
        >
          <Check className="h-5 w-5 mr-2" />
          Apply Cleaning Options
        </button>
      </div>
    </div>
  );
};

export default DataCleaningOptions;