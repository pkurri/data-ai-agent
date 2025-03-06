/**
 * Analytics service for interacting with the backend analytics API
 */
import axios from 'axios';

const API_BASE_URL = '/api';

export const getDataQualityReport = async (datasetName, storageType = 'file', version = null) => {
  try {
    const params = { storage_type: storageType };
    if (version) params.version = version;
    
    const response = await axios.get(`${API_BASE_URL}/reports/data-quality`, { 
      params: {
        dataset_name: datasetName,
        ...params
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching data quality report:', error);
    throw error;
  }
};

export const getColumnStatistics = async (datasetName, columnName, storageType = 'file', version = null) => {
  try {
    const params = { storage_type: storageType };
    if (version) params.version = version;
    
    const response = await axios.get(`${API_BASE_URL}/reports/column-stats`, { 
      params: {
        dataset_name: datasetName,
        column_name: columnName,
        ...params
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching column statistics:', error);
    throw error;
  }
};

export const getCorrelationMatrix = async (datasetName, columns = null, method = 'pearson', storageType = 'file', version = null) => {
  try {
    const params = { 
      storage_type: storageType,
      method
    };
    if (version) params.version = version;
    if (columns) params.columns = columns;
    
    const response = await axios.get(`${API_BASE_URL}/reports/correlation-matrix`, { 
      params: {
        dataset_name: datasetName,
        ...params
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching correlation matrix:', error);
    throw error;
  }
};

export const getDatasetSummary = async (datasetName, storageType = 'file', version = null) => {
  try {
    const params = { storage_type: storageType };
    if (version) params.version = version;
    
    const response = await axios.get(`${API_BASE_URL}/reports/summary`, { 
      params: {
        dataset_name: datasetName,
        ...params
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching dataset summary:', error);
    throw error;
  }
};