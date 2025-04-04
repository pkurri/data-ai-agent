import React, { useState, useEffect } from 'react';
import { RefreshCw, Download, FileText, AlertCircle } from 'lucide-react';
import { previewDataset, downloadDataset } from '../services/dataService';

const DataPreview = ({ dataset, refreshTrigger }) => {
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (dataset && dataset.name) {
      fetchPreview();
    } else {
      // Reset state when no dataset is selected
      setPreview(null);
      setError(null);
    }
  }, [dataset, refreshTrigger]);

  const fetchPreview = async () => {
    // Validate dataset before making request
    if (!dataset || !dataset.name) {
      console.warn('Invalid dataset:', dataset);
      setError('No dataset selected');
      return;
    }

    // Validate file type
    const fileExt = dataset.name.split('.').pop().toLowerCase();
    const allowedTypes = ['csv', 'json', 'xlsx', 'xls', 'txt'];
    if (!allowedTypes.includes(fileExt)) {
      setError(`Unsupported file type: ${fileExt}. Supported types: CSV, Excel, JSON, TXT`);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setPreview(null);
    
    try {
      console.log('Fetching preview for dataset:', dataset.name); // Debug log
      const response = await previewDataset(dataset.name);
      console.log('Preview response:', response); // Debug log
      
      if (!response || !response.success) {
        throw new Error(response?.error || 'Failed to load preview');
      }
      
      if (!Array.isArray(response.preview)) {
        throw new Error('Invalid preview data: preview must be an array');
      }
      
      if (!Array.isArray(response.columns)) {
        throw new Error('Invalid preview data: columns must be an array');
      }
      
      setPreview(response);
    } catch (err) {
      console.error('Preview error:', err);
      setError(err.message || 'Failed to load preview');
      setPreview(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!dataset || !dataset.name) {
      setError('No dataset selected for download');
      return;
    }
    
    try {
      await downloadDataset(dataset.name);
    } catch (err) {
      setError('Error downloading dataset: ' + (err.message || 'Unknown error'));
    }
  };

  if (!dataset || !dataset.name) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Data Preview</h2>
        </div>
        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
          <FileText className="h-12 w-12 text-gray-300 mx-auto" />
          <p className="mt-2 text-sm text-gray-500">Select a dataset to preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Data Preview: {dataset.name}
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchPreview}
            className="text-blue-600 text-sm hover:underline flex items-center"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
          <button
            onClick={handleDownload}
            className="text-blue-600 text-sm hover:underline flex items-center"
            disabled={isLoading || !preview}
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
          <span className="ml-2 text-gray-600">Loading preview...</span>
        </div>
      ) : preview ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {preview.columns.map((column, index) => (
                  <th
                    key={index}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {preview.preview.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {preview.columns.map((column, colIndex) => (
                    <td
                      key={`${rowIndex}-${colIndex}`}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                    >
                      {row[column]?.toString() || ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {preview.total_rows > preview.preview.length && (
            <p className="text-sm text-gray-500 mt-4 text-center">
              Showing {preview.preview.length} of {preview.total_rows} rows
            </p>
          )}
        </div>
      ) : (
        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
          <FileText className="h-12 w-12 text-gray-300 mx-auto" />
          <p className="mt-2 text-sm text-gray-500">No preview available</p>
          <p className="text-xs text-gray-400">Click refresh to load preview</p>
        </div>
      )}
    </div>
  );
};

export default DataPreview;