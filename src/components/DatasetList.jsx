import React, { useState, useEffect } from 'react';
import { Database, FileText, Trash2, Download, ExternalLink, RefreshCw, HardDrive, Cloud } from 'lucide-react';
import { listDatasets, deleteDataset, downloadDataset } from '../services/dataService';

const DatasetList = ({ onSelectDataset, refreshTrigger }) => {
  const [datasets, setDatasets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDatasetId, setSelectedDatasetId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    fetchDatasets();
  }, [refreshTrigger]);

  const fetchDatasets = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await listDatasets();
      if (response.success) {
        setDatasets(response.datasets);
      } else {
        setError('Failed to fetch datasets');
      }
    } catch (err) {
      setError('Error loading datasets: ' + (err.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDataset = (dataset) => {
    setSelectedDatasetId(dataset.name);
    if (onSelectDataset) {
      onSelectDataset(dataset);
    }
  };

  const handleDeleteDataset = async (datasetName, e) => {
    e.stopPropagation();
    
    if (window.confirm(`Are you sure you want to delete dataset "${datasetName}"?`)) {
      setIsDeleting(true);
      setDeleteId(datasetName);
      
      try {
        const response = await deleteDataset(datasetName);
        if (response.success) {
          setDatasets(datasets.filter(d => d.name !== datasetName));
          if (selectedDatasetId === datasetName) {
            setSelectedDatasetId(null);
            if (onSelectDataset) {
              onSelectDataset(null);
            }
          }
        } else {
          setError(`Failed to delete dataset: ${response.message || 'Unknown error'}`);
        }
      } catch (err) {
        setError('Error deleting dataset: ' + (err.message || 'Unknown error'));
      } finally {
        setIsDeleting(false);
        setDeleteId(null);
      }
    }
  };

  const handleDownloadDataset = async (datasetName, format, e) => {
    e.stopPropagation();
    
    try {
      await downloadDataset(datasetName, format);
    } catch (err) {
      setError('Error downloading dataset: ' + (err.message || 'Unknown error'));
    }
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'csv':
        return <FileText className="h-5 w-5 text-green-500" />;
      case 'json':
        return <FileText className="h-5 w-5 text-yellow-500" />;
      case 'excel':
      case 'xlsx':
      case 'xls':
        return <FileText className="h-5 w-5 text-blue-500" />;
      default:
        return <Database className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStorageIcon = (storageType, metadata) => {
    switch (storageType) {
      case 'hybrid':
        return (
          <div className="flex items-center" title="Hybrid Storage (File + DB2)">
            <FileText className="h-4 w-4 text-purple-500" />
            <Database className="h-4 w-4 text-purple-500 -ml-1" />
          </div>
        );
      case 'db2':
        return <Database className="h-4 w-4 text-blue-500" title="DB2 Storage" />;
      case 'file':
        return <HardDrive className="h-4 w-4 text-green-500" title="File Storage" />;
      default:
        return <Database className="h-4 w-4 text-gray-500" title="Unknown Storage Type" />;
    }
  };

  const getCacheStatus = (metadata) => {
    if (!metadata?.cache_status) return null;
    
    return (
      <span 
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
          metadata.cache_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}
        title={`Cache Status: ${metadata.cache_status}`}
      >
        <Cloud className="h-3 w-3 mr-1" />
        {metadata.cache_status === 'active' ? 'Cached' : 'Not Cached'}
      </span>
    );
  };

  if (isLoading && datasets.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Datasets</h2>
          <button 
            onClick={fetchDatasets}
            className="text-blue-600 text-sm hover:underline flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
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
                className={`hover:bg-gray-50 cursor-pointer transition-colors ${selectedDatasetId === dataset.name ? 'bg-blue-50' : ''}`}
                onClick={() => handleSelectDataset(dataset)}
              >
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center min-w-0">
                    <div className="flex-shrink-0">
                      {getFileIcon(dataset.file_type)}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900 truncate">{dataset.name}</p>
                        {getStorageIcon(dataset.storage_type, dataset.metadata)}
                        {getCacheStatus(dataset.metadata)}
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <span className="truncate">
                          {dataset.rows} rows • {dataset.columns} columns • {dataset.file_type}
                        </span>
                        {dataset.updated_at && (
                          <span className="ml-1 truncate">
                            • Updated {new Date(dataset.updated_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => handleDownloadDataset(dataset.name, dataset.file_type, e)}
                      className="p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-blue-50"
                      title="Download dataset"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteDataset(dataset.name, e)}
                      className="p-1 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-50"
                      title="Delete dataset"
                      disabled={isDeleting && deleteId === dataset.name}
                    >
                      {isDeleting && deleteId === dataset.name ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
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