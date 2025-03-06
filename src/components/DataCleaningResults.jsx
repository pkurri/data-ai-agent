import React from 'react';
import { Check, AlertCircle, Download, RefreshCw, FileText } from 'lucide-react';
import { downloadDataset } from '../services/dataService';

const DataCleaningResults = ({ results, isLoading, error }) => {
  const handleDownload = async (datasetName, format) => {
    if (!datasetName) return;
    
    try {
      await downloadDataset(datasetName, format);
    } catch (err) {
      console.error('Error downloading dataset:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Cleaning Results</h2>
        </div>
        <div className="flex flex-col items-center justify-center py-8">
          <RefreshCw className="h-12 w-12 text-blue-500 animate-spin" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Processing Your Data</h3>
          <p className="mt-2 text-sm text-gray-500">
            This may take a few moments depending on the size of your dataset.
          </p>
          <div className="w-full max-w-md bg-gray-200 rounded-full h-2.5 mt-4">
            <div className="bg-blue-600 h-2.5 rounded-full w-3/4 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Cleaning Results</h2>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error cleaning data</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Cleaning Results</h2>
        </div>
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
          <FileText className="h-12 w-12 text-gray-300 mx-auto" />
          <p className="mt-2 text-sm text-gray-500">No cleaning results yet</p>
          <p className="text-xs text-gray-400">Select a dataset and apply cleaning options</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Cleaning Results</h2>
        {results.cleaned_dataset_name && (
          <button
            onClick={() => handleDownload(results.cleaned_dataset_name, 'csv')}
            className="text-blue-600 text-sm hover:underline flex items-center"
          >
            <Download className="h-4 w-4 mr-1" />
            Download Cleaned Data
          </button>
        )}
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900">Data Cleaning Complete!</h3>
            <p className="text-sm text-gray-500">
              {results.cleaned_dataset_name 
                ? `Cleaned data saved as "${results.cleaned_dataset_name}"`
                : 'Data has been cleaned successfully'}
            </p>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Cleaning Report</h4>
          
          {results.report && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-md shadow-sm">
                  <p className="text-xs text-gray-500">Initial Rows</p>
                  <p className="text-lg font-medium">{results.report.initial_stats?.rows || 0}</p>
                </div>
                <div className="bg-white p-3 rounded-md shadow-sm">
                  <p className="text-xs text-gray-500">Final Rows</p>
                  <p className="text-lg font-medium">{results.report.final_stats?.rows || 0}</p>
                </div>
                <div className="bg-white p-3 rounded-md shadow-sm">
                  <p className="text-xs text-gray-500">Missing Values Handled</p>
                  <p className="text-lg font-medium">{results.report.changes?.missing_values_handled || 0}</p>
                </div>
                <div className="bg-white p-3 rounded-md shadow-sm">
                  <p className="text-xs text-gray-500">Duplicates Removed</p>
                  <p className="text-lg font-medium">{results.report.changes?.duplicates_removed || 0}</p>
                </div>
              </div>
              
              {results.report.changes?.rows_removed > 0 && (
                <div className="flex items-center bg-yellow-50 p-3 rounded-md">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <p className="ml-2 text-sm text-yellow-700">
                    {results.report.changes.rows_removed} rows were removed during cleaning
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="bg-blue-50 border border-blue-100 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Next Steps</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>View the cleaned dataset in the Data Preview</li>
                  <li>Download the cleaned data for further analysis</li>
                  <li>Run additional cleaning operations if needed</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataCleaningResults;