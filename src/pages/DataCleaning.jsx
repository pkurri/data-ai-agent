import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Check, AlertCircle, RefreshCw, Database } from 'lucide-react';
import { useStore } from '../store';
import { useHuggingFaceModel } from '../hooks/useHuggingFaceModel';
import DataUploader from '../components/DataUploader';
import DatasetList from '../components/DatasetList';
import DataCleaningOptions from '../components/DataCleaningOptions';
import DataPreview from '../components/DataPreview';
import DataCleaningResults from '../components/DataCleaningResults';
import { listDatasets, cleanDataset } from '../services/dataService';

const DataCleaning = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [cleaningOptions, setCleaningOptions] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState(null);
  const [cleaningResults, setCleaningResults] = useState(null);

  const { addProject } = useStore();
  const { runTextCleaning } = useHuggingFaceModel();

  const handleUploadSuccess = (result) => {
    setRefreshTrigger(prev => prev + 1);
    setActiveTab('analyze');
  };

  const handleSelectDataset = (dataset) => {
    setSelectedDataset(dataset);
    setCleaningOptions(null); // Reset options when new dataset selected
    setCleaningResults(null);
    if (dataset) {
      setActiveTab('analyze');
    }
  };

  const handleApplyOptions = (options) => {
    setCleaningOptions(options);
    setActiveTab('clean'); // Ensure we switch to clean tab
    setCleaningResults(null);
  };

  const handleCleanData = async () => {
    if (!selectedDataset) return;
    
    setIsProcessing(true);
    setProcessingError(null);
    
    try {
      const result = await cleanDataset(
        selectedDataset.name,
        {
          remove_duplicates: cleaningOptions.removeDuplicates,
          handle_missing_values: cleaningOptions.handleMissingValues,
          normalize_text: cleaningOptions.normalizeText,
          detect_outliers: cleaningOptions.detectOutliers,
          fix_typos: cleaningOptions.fixTypos
        }
      );
      
      setCleaningResults(result);
      setRefreshTrigger(prev => prev + 1);
      
      // Add to recent projects
      addProject({
        id: Date.now().toString(),
        name: result.cleaned_dataset_name || selectedDataset.name,
        description: 'Data cleaning project',
        status: 'Completed',
        model: 'Data Cleaning Pipeline',
        lastUpdated: new Date().toLocaleDateString()
      });
      
      setActiveTab('export');
    } catch (error) {
      console.error('Error cleaning data:', error);
      setProcessingError(error.response?.data?.detail || 'Error cleaning data');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Data Cleaning</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['upload', 'analyze', 'clean', 'export'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Content based on active tab */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-1 space-y-6">
          {activeTab === 'upload' ? (
            <DataUploader onUploadSuccess={handleUploadSuccess} />
          ) : (
            <DatasetList 
              onSelectDataset={handleSelectDataset} 
              refreshTrigger={refreshTrigger}
            />
          )}
          
          {activeTab !== 'upload' && (
            <DataCleaningOptions 
              onApplyOptions={handleApplyOptions} 
              initialOptions={cleaningOptions} 
              selectedDataset={selectedDataset}
              disabled={isProcessing}
            />
          )}
        </div>
        
        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'clean' ? (
            <DataCleaningResults 
              results={cleaningResults}
              isLoading={isProcessing}
              error={processingError}
            />
          ) : null}
          
          {activeTab === 'export' && cleaningResults ? (
            <DataCleaningResults 
              results={cleaningResults}
              isLoading={false}
              error={null}
            />
          ) : null}
          
          <DataPreview 
            dataset={selectedDataset} 
            refreshTrigger={refreshTrigger}
          />
          
          {activeTab === 'clean' && !isProcessing && !cleaningResults && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Ready to Clean Your Data</h3>
                <p className="text-sm text-gray-500">
                  We'll apply the following operations to your dataset:
                </p>
                <ul className="text-sm text-gray-700 space-y-2 mt-4 max-w-md mx-auto text-left">
                  {cleaningOptions.removeDuplicates && (
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      Remove duplicate entries
                    </li>
                  )}
                  {cleaningOptions.handleMissingValues && (
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      Handle missing values: {cleaningOptions.handleMissingValues === 'impute' ? 'Impute with mean/mode' : 
                                            cleaningOptions.handleMissingValues === 'remove' ? 'Remove rows' : 'Fill with custom value'}
                    </li>
                  )}
                  {cleaningOptions.normalizeText && (
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      Normalize text formatting
                    </li>
                  )}
                  {cleaningOptions.detectOutliers && (
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      Detect and handle outliers
                    </li>
                  )}
                  {cleaningOptions.fixTypos && (
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      Fix typos using NLP models
                    </li>
                  )}
                </ul>
                
                <button
                  onClick={handleCleanData}
                  className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors inline-flex items-center"
                  disabled={!selectedDataset}
                >
                  <Database className="h-5 w-5 mr-2" />
                  Start Cleaning
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataCleaning;