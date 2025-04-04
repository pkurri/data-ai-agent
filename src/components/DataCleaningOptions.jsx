import React, { useState, useEffect } from 'react';
import { Check, AlertCircle, Sliders, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import { previewDataset } from '../services/dataService';

const DataCleaningOptions = ({ onApplyOptions, initialOptions, disabled, selectedDataset }) => {
  const defaultOptions = {
    removeDuplicates: false,
    handleMissingValues: 'custom',
    customMissingValue: '',
    normalizeText: false,
    detectOutliers: false,
    fixTypos: false,
    selectedColumns: {
      textColumns: [],
      numericColumns: [],
      duplicateCheckColumns: [],
      outlierColumns: []
    },
  };

  const [availableColumns, setAvailableColumns] = useState([]);
  const [isLoadingColumns, setIsLoadingColumns] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    duplicates: false,
    missingValues: false,
    textNormalization: false,
    outliers: false
  });
  
  const [options, setOptions] = useState(initialOptions || defaultOptions);

  // Reset options when selectedDataset changes
  useEffect(() => {
    setOptions(defaultOptions);
    setExpandedSections({
      duplicates: false,
      missingValues: false,
      textNormalization: false,
      outliers: false
    });
  }, [selectedDataset]);

  // Fetch columns when dataset changes
  useEffect(() => {
    if (selectedDataset && selectedDataset.name) {
      fetchColumns(selectedDataset.name);
    }
  }, [selectedDataset]);

  // Function to fetch columns from the selected dataset
  const fetchColumns = async (datasetName) => {
    setIsLoadingColumns(true);
    try {
      const response = await previewDataset(datasetName);
      if (response && response.success && response.columns) {
        setAvailableColumns(response.columns);
      }
    } catch (error) {
      console.error('Error fetching columns:', error);
    } finally {
      setIsLoadingColumns(false);
    }
  };

  // Function to handle column selection
  const handleColumnSelectionChange = (category, column, isSelected) => {
    setOptions(prev => {
      const updatedSelectedColumns = { ...prev.selectedColumns };
      
      if (!updatedSelectedColumns[category]) {
        updatedSelectedColumns[category] = [];
      }
      
      if (isSelected) {
        if (!updatedSelectedColumns[category].includes(column)) {
          updatedSelectedColumns[category] = [...updatedSelectedColumns[category], column];
        }
      } else {
        updatedSelectedColumns[category] = updatedSelectedColumns[category].filter(col => col !== column);
      }
      
      return {
        ...prev,
        selectedColumns: updatedSelectedColumns
      };
    });
  };

  const handleOptionChange = (option, value) => {
    setOptions(prev => ({
      ...prev,
      [option]: value
    }));
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleApply = () => {
    // First call parent callback with current options
    onApplyOptions(options);
    
    // Then reset local state
    setOptions(defaultOptions);
    setExpandedSections({
      duplicates: false,
      missingValues: false,
      textNormalization: false,
      outliers: false
    });
  };

  const selectAllColumns = (category) => {
    setOptions(prev => {
      const updatedSelectedColumns = { ...prev.selectedColumns };
      updatedSelectedColumns[category] = [...availableColumns];
      return {
        ...prev,
        selectedColumns: updatedSelectedColumns
      };
    });
  };

  const clearAllColumns = (category) => {
    setOptions(prev => {
      const updatedSelectedColumns = { ...prev.selectedColumns };
      updatedSelectedColumns[category] = [];
      return {
        ...prev,
        selectedColumns: updatedSelectedColumns
      };
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sliders className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Data Cleaning Options</h2>
          </div>
          {isLoadingColumns && (
            <div className="flex items-center text-xs font-medium">
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              Loading columns...
            </div>
          )}
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Remove duplicates */}
        <div className="rounded-lg border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow duration-200">
          <div className="bg-gray-50 p-3">
            <div className="flex items-start space-x-3">
              <div className="flex items-center h-5 pt-0.5">
                <input
                  id="removeDuplicates"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={options.removeDuplicates}
                  onChange={(e) => handleOptionChange('removeDuplicates', e.target.checked)}
                  disabled={disabled}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="removeDuplicates" className="font-medium text-gray-700">
                    Remove duplicate entries
                  </label>
                  {options.removeDuplicates && (
                    <button 
                      onClick={() => toggleSection('duplicates')} 
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center transition-colors duration-200"
                    >
                      {expandedSections.duplicates ? (
                        <>
                          <span>Hide columns</span>
                          <ChevronDown className="h-4 w-4 ml-1" />
                        </>
                      ) : (
                        <>
                          <span>Select columns</span>
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </>
                      )}
                    </button>
                  )}
                </div>
                <p className="text-gray-500 text-xs">Identify and remove duplicate rows from the dataset</p>
              </div>
            </div>
          </div>

          {/* Column selection for duplicates */}
          {options.removeDuplicates && expandedSections.duplicates && (
            <div className="p-3 border-t border-gray-200 bg-white">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-gray-700">Select columns to check for duplicates</h3>
                <div className="space-x-2">
                  <button 
                    className="text-xs text-blue-600 hover:text-blue-800 transition-colors duration-200"
                    onClick={() => selectAllColumns('duplicateCheckColumns')}
                    disabled={disabled}
                  >
                    Select All
                  </button>
                  <button 
                    className="text-xs text-red-600 hover:text-red-800 transition-colors duration-200"
                    onClick={() => clearAllColumns('duplicateCheckColumns')}
                    disabled={disabled}
                  >
                    Clear All
                  </button>
                </div>
              </div>
              <div className="max-h-40 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-1">
                {availableColumns.map(column => (
                  <div key={`dup-${column}`} className="flex items-center py-1">
                    <input
                      id={`dup-${column}`}
                      type="checkbox"
                      className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={options.selectedColumns.duplicateCheckColumns.includes(column)}
                      onChange={(e) => handleColumnSelectionChange('duplicateCheckColumns', column, e.target.checked)}
                      disabled={disabled}
                    />
                    <label htmlFor={`dup-${column}`} className="ml-2 block text-xs text-gray-700 truncate">
                      {column}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Handle missing values */}
        <div className="rounded-lg border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow duration-200">
          <div className="bg-gray-50 p-3">
            <div className="space-y-2">
              <label htmlFor="missingValues" className="block font-medium text-gray-700">
                Handle missing values
              </label>
              <select
                id="missingValues"
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={options.handleMissingValues}
                onChange={(e) => handleOptionChange('handleMissingValues', e.target.value)}
              >
                <option value="custom">Fill with custom value</option>
                <option value="none">Don't handle</option>
                <option value="impute">Fill with mean value</option>
                <option value="remove">Remove rows</option>
              </select>
              {options.handleMissingValues === 'custom' && (
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Enter custom value"
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    value={options.customMissingValue}
                    onChange={(e) => handleOptionChange('customMissingValue', e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Column selection for missing values */}
          {options.handleMissingValues !== 'none' && (
            <div className="border-t border-gray-200">
              <div 
                className="flex items-center justify-between p-3 cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                onClick={() => toggleSection('missingValues')}
              >
                <h3 className="text-sm font-medium text-gray-700">Column selection</h3>
                {expandedSections.missingValues ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
              </div>
              
              {expandedSections.missingValues && (
                <div className="p-3 border-t border-gray-200 bg-white">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium text-gray-700">Select numeric columns for missing value handling</h3>
                    <div className="space-x-2">
                      <button 
                        className="text-xs text-blue-600 hover:text-blue-800 transition-colors duration-200"
                        onClick={() => selectAllColumns('numericColumns')}
                        disabled={disabled}
                      >
                        Select All
                      </button>
                      <button 
                        className="text-xs text-red-600 hover:text-red-800 transition-colors duration-200"
                        onClick={() => clearAllColumns('numericColumns')}
                        disabled={disabled}
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                  <div className="max-h-40 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-1">
                    {availableColumns.map(column => (
                      <div key={`miss-${column}`} className="flex items-center py-1">
                        <input
                          id={`miss-${column}`}
                          type="checkbox"
                          className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          checked={options.selectedColumns.numericColumns.includes(column)}
                          onChange={(e) => handleColumnSelectionChange('numericColumns', column, e.target.checked)}
                          disabled={disabled}
                        />
                        <label htmlFor={`miss-${column}`} className="ml-2 block text-xs text-gray-700 truncate">
                          {column}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Normalize text */}
        <div className="rounded-lg border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow duration-200">
          <div className="bg-gray-50 p-3">
            <div className="flex items-start space-x-3">
              <div className="flex items-center h-5 pt-0.5">
                <input
                  id="normalizeText"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={options.normalizeText}
                  onChange={(e) => handleOptionChange('normalizeText', e.target.checked)}
                  disabled={disabled}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="normalizeText" className="font-medium text-gray-700">
                    Normalize text
                  </label>
                  {options.normalizeText && (
                    <button 
                      onClick={() => toggleSection('textNormalization')} 
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center transition-colors duration-200"
                    >
                      {expandedSections.textNormalization ? (
                        <>
                          <span>Hide columns</span>
                          <ChevronDown className="h-4 w-4 ml-1" />
                        </>
                      ) : (
                        <>
                          <span>Select columns</span>
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </>
                      )}
                    </button>
                  )}
                </div>
                <p className="text-gray-500 text-xs">Convert text to lowercase and trim whitespace</p>
              </div>
            </div>
          </div>

          {/* Column selection for text normalization */}
          {options.normalizeText && expandedSections.textNormalization && (
            <div className="p-3 border-t border-gray-200 bg-white">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-gray-700">Select text columns to normalize</h3>
                <div className="space-x-2">
                  <button 
                    className="text-xs text-blue-600 hover:text-blue-800 transition-colors duration-200"
                    onClick={() => selectAllColumns('textColumns')}
                    disabled={disabled}
                  >
                    Select All
                  </button>
                  <button 
                    className="text-xs text-red-600 hover:text-red-800 transition-colors duration-200"
                    onClick={() => clearAllColumns('textColumns')}
                    disabled={disabled}
                  >
                    Clear All
                  </button>
                </div>
              </div>
              <div className="max-h-40 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-1">
                {availableColumns.map(column => (
                  <div key={`txt-${column}`} className="flex items-center py-1">
                    <input
                      id={`txt-${column}`}
                      type="checkbox"
                      className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={options.selectedColumns.textColumns.includes(column)}
                      onChange={(e) => handleColumnSelectionChange('textColumns', column, e.target.checked)}
                      disabled={disabled}
                    />
                    <label htmlFor={`txt-${column}`} className="ml-2 block text-xs text-gray-700 truncate">
                      {column}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Detect outliers */}
        <div className="rounded-lg border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow duration-200">
          <div className="bg-gray-50 p-3">
            <div className="flex items-start space-x-3">
              <div className="flex items-center h-5 pt-0.5">
                <input
                  id="detectOutliers"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={options.detectOutliers}
                  onChange={(e) => handleOptionChange('detectOutliers', e.target.checked)}
                  disabled={disabled}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="detectOutliers" className="font-medium text-gray-700">
                    Detect and handle outliers
                  </label>
                  {options.detectOutliers && (
                    <button 
                      onClick={() => toggleSection('outliers')} 
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center transition-colors duration-200"
                    >
                      {expandedSections.outliers ? (
                        <>
                          <span>Hide columns</span>
                          <ChevronDown className="h-4 w-4 ml-1" />
                        </>
                      ) : (
                        <>
                          <span>Select columns</span>
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </>
                      )}
                    </button>
                  )}
                </div>
                <p className="text-gray-500 text-xs">Identify and handle outliers in numeric data</p>
              </div>
            </div>
          </div>

          {/* Column selection for outliers */}
          {options.detectOutliers && expandedSections.outliers && (
            <div className="p-3 border-t border-gray-200 bg-white">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-gray-700">Select numeric columns for outlier detection</h3>
                <div className="space-x-2">
                  <button 
                    className="text-xs text-blue-600 hover:text-blue-800 transition-colors duration-200"
                    onClick={() => selectAllColumns('outlierColumns')}
                    disabled={disabled}
                  >
                    Select All
                  </button>
                  <button 
                    className="text-xs text-red-600 hover:text-red-800 transition-colors duration-200"
                    onClick={() => clearAllColumns('outlierColumns')}
                    disabled={disabled}
                  >
                    Clear All
                  </button>
                </div>
              </div>
              <div className="max-h-40 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-1">
                {availableColumns.map(column => (
                  <div key={`out-${column}`} className="flex items-center py-1">
                    <input
                      id={`out-${column}`}
                      type="checkbox"
                      className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={options.selectedColumns.outlierColumns.includes(column)}
                      onChange={(e) => handleColumnSelectionChange('outlierColumns', column, e.target.checked)}
                      disabled={disabled}
                    />
                    <label htmlFor={`out-${column}`} className="ml-2 block text-xs text-gray-700 truncate">
                      {column}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Fix typos */}
        <div className="rounded-lg border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow duration-200">
          <div className="bg-gray-50 p-3">
            <div className="flex items-start space-x-3">
              <div className="flex items-center h-5 pt-0.5">
                <input
                  id="fixTypos"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={options.fixTypos}
                  onChange={(e) => handleOptionChange('fixTypos', e.target.checked)}
                  disabled={disabled}
                />
              </div>
              <div className="flex-1">
                <label htmlFor="fixTypos" className="font-medium text-gray-700">
                  Fix typos in text fields
                </label>
                <p className="text-gray-500 text-xs">Attempt to automatically correct common typos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Apply button */}
        <div className="pt-4 flex justify-end">
          <button
            type="button"
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${disabled ? 'bg-gray-400' : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200`}
            onClick={handleApply}
            disabled={disabled}
          >
            {disabled ? (
              <>
                <RefreshCw className="-ml-1 mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check className="-ml-1 mr-2 h-4 w-4" />
                Apply Options
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataCleaningOptions;