import React, { useState, useEffect } from 'react';
import { Database, FileText, Trash2, Download, RefreshCw } from 'lucide-react';
import { listDatasets, deleteDataset, downloadDataset } from '../services/dataService';

const DatasetList = ({ onSelectDataset, refreshTrigger }) => {
  const [datasets, setDatasets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDatasetId, setSelectedDatasetId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchDatasets();
  }, [refreshTrigger]);

  const fetchDatasets = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await listDatasets();
      console.log('Datasets response:', response); // Debug log
      
      if (!response || !response.success) {
        throw new Error(response?.error || 'Failed to fetch datasets');
      }
      
      if (!Array.isArray(response.datasets)) {
        throw new Error('Invalid datasets format from server');
      }
      
      // Ensure each dataset has required properties
      const validDatasets = response.datasets.map(dataset => ({
        name: dataset.name || '',
        size: dataset.size || 0,
        modified: dataset.modified || Date.now() / 1000,
        type: dataset.type || 'unknown'
      }));
      
      setDatasets(validDatasets);
    } catch (err) {
      console.error('Error fetching datasets:', err);
      setError('Error loading datasets: ' + (err.message || 'Unknown error'));
      setDatasets([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDataset = (dataset) => {
    if (!dataset || !dataset.name) {
      console.warn('Attempted to select invalid dataset:', dataset);
      return;
    }
    
    setSelectedDatasetId(dataset.name);
    if (onSelectDataset) {
      onSelectDataset(dataset);
    }
  };

  const handleDeleteDataset = async (datasetName, e) => {
    e.stopPropagation();
    
    if (!datasetName) {
      console.warn('Attempted to delete dataset with no name');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete dataset "${datasetName}"?`)) {
      setIsDeleting(true);
      
      try {
        const response = await deleteDataset(datasetName);
        if (!response || !response.success) {
          throw new Error(response?.error || 'Failed to delete dataset');
        }
        
        setDatasets(datasets.filter(d => d.name !== datasetName));
        
        if (selectedDatasetId === datasetName) {
          setSelectedDatasetId(null);
          if (onSelectDataset) {
            onSelectDataset(null);
          }
        }
      } catch (err) {
        setError('Error deleting dataset: ' + (err.message || 'Unknown error'));
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleDownloadDataset = async (datasetName, e) => {
    e.stopPropagation();
    
    if (!datasetName) {
      console.warn('Attempted to download dataset with no name');
      return;
    }
    
    try {
      const response = await downloadDataset(datasetName);
      if (!response || !response.success) {
        throw new Error(response?.error || 'Failed to download dataset');
      }
    } catch (err) {
      setError('Error downloading dataset: ' + (err.message || 'Unknown error'));
    }
  };

  const getFileIcon = (filename) => {
    if (!filename) return <Database className="h-5 w-5 text-gray-500" />;
    
    const extension = filename.split('.').pop().toLowerCase();
    switch (extension) {
      case 'csv':
        return <FileText className="h-5 w-5 text-green-500" />;
      case 'json':
        return <FileText className="h-5 w-5 text-yellow-500" />;
      case 'xlsx':
      case 'xls':
        return <FileText className="h-5 w-5 text-blue-500" />;
      default:
        return <Database className="h-5 w-5 text-gray-500" />;
    }
  };

  if (isLoading && datasets.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Datasets</h2>
          <button 
            onClick={fetchDatasets}
            className="text-blue-600 text-sm hover:underline flex items-center"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        <div className="flex justify-center items-center py-8">
          <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
          <span className="ml-2 text-gray-600">Loading datasets...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Datasets</h2>
        <button 
          onClick={fetchDatasets}
          className="text-blue-600 text-sm hover:underline flex items-center"
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      
      {datasets.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
          <Database className="h-12 w-12 text-gray-300 mx-auto" />
          <p className="mt-2 text-sm text-gray-500">No datasets found</p>
          <p className="text-xs text-gray-400">Upload a file to get started</p>
        </div>
      ) : (
        <div className="overflow-hidden border border-gray-200 rounded-md">
          <ul className="divide-y divide-gray-200">
            {datasets.map((dataset) => (
              <li 
                key={dataset.name}
                className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedDatasetId === dataset.name ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleSelectDataset(dataset)}
              >
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center min-w-0">
                    <div className="flex-shrink-0">
                      {getFileIcon(dataset.name)}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {dataset.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(dataset.size / 1024).toFixed(2)} KB • Last modified: {new Date(dataset.modified * 1000).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => handleDownloadDataset(dataset.name, e)}
                      className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                      title="Download dataset"
                      disabled={!dataset.name || isDeleting}
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteDataset(dataset.name, e)}
                      className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                      title="Delete dataset"
                      disabled={!dataset.name || isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DatasetList;