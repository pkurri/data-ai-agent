/**
 * Data service for interacting with the backend data API
 */
import axios from 'axios';

// Configure axios defaults based on backend API configuration
axios.defaults.baseURL = 'http://127.0.0.1:5000';
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.timeout = 30000; // 30 seconds timeout

// Add response interceptor for error handling and retries
let retryCount = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

axios.interceptors.response.use(
  (response) => {
    retryCount = 0; // Reset retry count on successful response
    return response;
  },
  async (error) => {
    if (!error.response && retryCount < MAX_RETRIES) {
      retryCount++;
      console.log(`Retrying request (${retryCount}/${MAX_RETRIES})...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return axios(error.config);
    }
    retryCount = 0; // Reset retry count after max retries or if we have a response
    return Promise.reject(error);
  }
);

export const uploadDataset = async (file) => {
  try {
    // Validate file size (16MB limit)
    const MAX_FILE_SIZE = 16 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum allowed size of 16MB`);
    }

    // Validate file type
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/json',
      'text/plain'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} not allowed. Supported formats: CSV, Excel, JSON, TXT`);
    }

    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post('/datasets', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    if (!response.data || !response.data.success) {
      throw new Error(response.data?.error || 'Failed to upload dataset');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error uploading dataset:', error);
    throw new Error(error.response?.data?.error || error.message || 'Failed to upload dataset');
  }
};

export const listDatasets = async () => {
  try {
    console.log('Fetching datasets list...'); // Debug log
    const response = await axios.get('/datasets');
    console.log('List datasets response:', response.data); // Debug log
    
    if (!response.data || !response.data.success) {
      throw new Error(response.data?.error || 'Failed to fetch datasets');
    }
    
    if (!Array.isArray(response.data.datasets)) {
      throw new Error('Invalid response format: datasets not an array');
    }
    
    return {
      success: true,
      datasets: response.data.datasets.map(dataset => ({
        name: dataset.name || '',
        size: dataset.size || 0,
        modified: dataset.modified || Date.now() / 1000,
        type: dataset.type || 'unknown'
      }))
    };
  } catch (error) {
    console.error('Error listing datasets:', error);
    throw new Error(error.response?.data?.error || error.message || 'Failed to list datasets');
  }
};

export const previewDataset = async (name) => {
  try {
    if (!name) {
      throw new Error('Dataset name is required');
    }
    
    // URL encode the dataset name to handle special characters
    const encodedName = encodeURIComponent(name);
    console.log('Requesting preview for dataset:', name, 'encoded as:', encodedName); // Debug log
    
    const response = await axios.get(`/datasets/${encodedName}/preview`);
    console.log('Preview response:', response); // Debug log
    
    if (!response.data) {
      throw new Error('No response data received');
    }
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to preview dataset');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error previewing dataset:', error);
    if (error.response?.status === 404) {
      throw new Error('Dataset not found');
    }
    throw new Error(error.response?.data?.error || error.message || 'Failed to preview dataset');
  }
};

export const downloadDataset = async (name) => {
  try {
    if (!name) {
      throw new Error('Dataset name is required');
    }
    
    // URL encode the dataset name to handle special characters
    const encodedName = encodeURIComponent(name);
    console.log('Downloading dataset:', name, 'encoded as:', encodedName); // Debug log
    
    const response = await axios.get(`/datasets/${encodedName}/download`, {
      responseType: 'blob'
    });
    
    // Create a download link and trigger it
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', name);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return { success: true };
  } catch (error) {
    console.error('Error downloading dataset:', error);
    if (error.response?.status === 404) {
      throw new Error('Dataset not found');
    }
    throw new Error(error.response?.data?.error || error.message || 'Failed to download dataset');
  }
};

export const deleteDataset = async (name) => {
  try {
    if (!name) {
      throw new Error('Dataset name is required');
    }
    
    // URL encode the dataset name to handle special characters
    const encodedName = encodeURIComponent(name);
    console.log('Deleting dataset:', name, 'encoded as:', encodedName); // Debug log
    
    const response = await axios.delete(`/datasets/${encodedName}`);
    console.log('Delete response:', response.data); // Debug log
    
    if (!response.data || !response.data.success) {
      throw new Error(response.data?.error || 'Failed to delete dataset');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error deleting dataset:', error);
    if (error.response?.status === 404) {
      throw new Error('Dataset not found');
    }
    throw new Error(error.response?.data?.error || error.message || 'Failed to delete dataset');
  }
};

export const cleanDataset = async (filename, operations = {}) => {
  try {
    if (!filename) {
      throw new Error('Dataset filename is required');
    }
    
    console.log('Cleaning dataset:', filename, 'with operations:', operations); // Debug log
    const response = await axios.post('/clean', {
      filename,
      operations
    });
    console.log('Clean response:', response.data); // Debug log
    
    if (!response.data || !response.data.success) {
      throw new Error(response.data?.error || 'Failed to clean dataset');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error cleaning dataset:', error);
    if (error.response?.status === 404) {
      throw new Error('Dataset not found');
    }
    if (error.response?.status === 400) {
      throw new Error(error.response.data?.error || 'Invalid cleaning operations');
    }
    throw new Error(error.response?.data?.error || error.message || 'Failed to clean dataset');
  }
};