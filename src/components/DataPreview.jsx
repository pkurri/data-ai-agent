import React, { useState, useEffect } from 'react';
import { RefreshCw, Download, FileText, AlertCircle } from 'lucide-react';
import { previewDataset, downloadDataset } from '../services/dataService';

const DataPreview = ({ dataset, refreshTrigger }) => {
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewRows, setPreviewRows] = useState(10);

  useEffect(() => {
    if (dataset) {
      fetchPreview();
    } else {
      setPreview(null);
    }
  }, [dataset, refreshTrigger]);

  const fetchPreview = async () => {
    if (!dataset) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await previewDataset(dataset.name, dataset.storage_type, null, previewRows);
      if (response.success) {
        setPreview(response);
      } else {
        setError('Failed to fetch dataset preview');
      }
    } catch (err) {
      setError('Error loading preview: ' + (err.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (format) => {
    if (!dataset) return;
    
    try {
      await downloadDataset(dataset.name, format);
    } catch (err) {
      setError('Error downloading dataset: ' + (err.message || 'Unknown error'));
    }
  };

  const handleRefresh = () => {
    fetchPreview();
  };

  const handleRowsChange = (e) => {
    const value = parseInt(e.target.value, 10);
    setPreviewRows(value);
  };

  if (!dataset) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Data Preview</h2>
        </div>
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
          <FileText className="h-12 w-12 text-gray-300 mx-auto" />
          <p className="mt-2 text-sm text-gray-500">No dataset selected</p>
          <p className="text-xs text-gray-400">Select a dataset to preview its data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Data Preview: {dataset.name}</h2>
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            <label htmlFor="previewRows" className="mr-2 text-sm text-gray-600">
              Rows:
            </label>
            <select
              id="previewRows"
              value={previewRows}
              onChange={handleRowsChange}
              className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
          <button
            onClick={handleRefresh}
            className="p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-blue-50"
            title="Refresh preview"
            disabled={isLoading}
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <div className="relative group">
            <button
              className="p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-blue-50"
              title="Download dataset"
            >
              <Download className="h-5 w-5" />
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
              <button
                onClick={() => handleDownload('csv')}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
              >
                Download as CSV
              </button>
              <button
                onClick={() => handleDownload('json')}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
              >
                Download as JSON
              </button>
              <button
                onClick={() => handleDownload('excel')}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
              >
                Download as Excel
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="ml-2 text-sm text-red-700">{error}</p>
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
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {preview.columns && preview.columns.map((column, index) => (
                      <th 
                        key={index}
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {preview.preview && preview.preview.map((row, rowIndex) => (
                    <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {preview.columns.map((column, colIndex) => (
                        <td 
                          key={colIndex} 
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                        >
                          {row[column] !== null && row[column] !== undefined 
                            ? String(row[column]) 
                            : <span className="text-gray-300">null</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-500">
            Showing {preview.preview?.length || 0} of {preview.total_rows} rows
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No preview available</p>
        </div>
      )}
    </div>
  );
};

export default DataPreview;