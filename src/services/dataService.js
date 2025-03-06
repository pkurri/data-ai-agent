/**
 * Data service for interacting with the backend data API
 */
import axios from 'axios';

const API_BASE_URL = '/api';

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.headers.common['Accept'] = 'application/json';

// Mock data for development when API is unavailable
const MOCK_DATASETS = [
  {
    name: 'sample_dataset.csv',
    file_type: 'csv',
    storage_type: 'file',
    size: 1024,
    rows: 100,
    columns: 5,
    modified: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: {
      storage_info: {
        primary: 'file',
        fallback: 'db2'
      },
      cache_status: 'active'
    }
  }
];

// Add response interceptor for error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log the error for debugging
    console.error('API Error:', error.message);

    // If the API is down, return mock data for development
    if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
      if (error.config.url.includes('/datasets')) {
        return Promise.resolve({ 
          data: { 
            success: true, 
            datasets: MOCK_DATASETS 
          } 
        });
      }
    }

    return Promise.reject(error);
  }
);

export const uploadDataset = async (file, datasetName = null, fileType = null) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    if (datasetName) {
      formData.append('dataset_name', datasetName);
    }
    
    if (fileType) {
      formData.append('file_type', fileType);
    }
    
    const response = await axios.post('/data/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error uploading dataset:', error.message);
    throw new Error('Failed to upload dataset. Please try again.');
  }
};

export const cleanDataset = async (datasetName, options = {}, storageType = 'hybrid', version = null, saveResult = true, resultName = null) => {
  try {
    const payload = {
      dataset_name: datasetName,
      options,
      storage_type: storageType,
      save_result: saveResult,
      storage_config: {
        primary: storageType,
        fallback: storageType === 'file' ? 'db2' : 'file'
      }
    };
    
    if (version) payload.version = version;
    if (resultName) payload.result_name = resultName;
    
    const response = await axios.post('/data/clean', payload);
    return response.data;
  } catch (error) {
    console.error('Error cleaning dataset:', error.message);
    throw new Error('Failed to clean dataset. Please try again.');
  }
};

export const listDatasets = async (storageType = 'all', useCache = true) => {
  try {
    const response = await axios.get('/data/datasets', {
      params: { 
        storage_type: storageType,
        use_cache: useCache 
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error listing datasets:', error.message);
    return {
      success: true,
      datasets: MOCK_DATASETS
    };
  }
};

export const getDatasetInfo = async (datasetName, storageType = 'file', version = null) => {
  try {
    const params = { storage_type: storageType };
    if (version) params.version = version;
    
    const response = await axios.get(`/data/datasets/${datasetName}`, { params });
    return response.data;
  } catch (error) {
    console.error('Error getting dataset info:', error.message);
    throw new Error('Failed to fetch dataset information.');
  }
};

export const previewDataset = async (datasetName, storageType = 'file', version = null, rows = 10) => {
  try {
    const params = { 
      storage_type: storageType,
      rows
    };
    if (version) params.version = version;
    
    const response = await axios.get(`/data/datasets/${datasetName}/preview`, { params });
    return response.data;
  } catch (error) {
    console.error('Error previewing dataset:', error.message);
    // Return mock preview data
    return {
      success: true,
      preview: Array(rows).fill({
        column1: 'Sample Data',
        column2: 123,
        column3: new Date().toISOString()
      }),
      columns: ['column1', 'column2', 'column3'],
      total_rows: 100
    };
  }
};

export const downloadDataset = async (datasetName, format = 'csv', storageType = 'file', version = null) => {
  try {
    const params = { 
      format,
      storage_type: storageType
    };
    if (version) params.version = version;
    
    const response = await axios.get(`/data/datasets/${datasetName}/download`, { 
      params,
      responseType: 'blob'
    });
    
    // Create a download link and trigger it
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${datasetName}.${format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error downloading dataset:', error.message);
    throw new Error('Failed to download dataset.');
  }
};

export const deleteDataset = async (datasetName, storageType = 'file', version = null) => {
  try {
    const params = { storage_type: storageType };
    if (version) params.version = version;
    
    const response = await axios.delete(`/data/datasets/${datasetName}`, { params });
    return response.data;
  } catch (error) {
    console.error('Error deleting dataset:', error.message);
    throw new Error('Failed to delete dataset.');
  }
};