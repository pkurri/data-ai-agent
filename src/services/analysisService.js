import axios from 'axios';

const API_BASE_URL = '/api';

export const analyzeDataset = async (datasetName, options = {}) => {
  try {
    const {
      analysisType = 'all',
      storageType = 'hybrid',
      useCache = true,
      numericColumns = [],
      dateColumns = [],
      timeSeriesColumns = [],
      anomalyThresholds = {},
      cacheTTL = 3600
    } = options;

    const response = await axios.post(`${API_BASE_URL}/analysis/analyze`, {
      dataset_name: datasetName,
      analysis_type: analysisType,
      storage_type: storageType,
      use_cache: useCache,
      numeric_columns: numericColumns,
      date_columns: dateColumns,
      time_series_columns: timeSeriesColumns,
      anomaly_thresholds: anomalyThresholds,
      cache_ttl: cacheTTL
    });

    return response.data;
  } catch (error) {
    console.error('Error analyzing dataset:', error.message);
    throw new Error('Failed to analyze dataset. Please try again.');
  }
};

export const getAnalysisReports = async (datasetName, options = {}) => {
  try {
    const {
      type = 'all',
      limit = 10
    } = options;

    const response = await axios.get(`${API_BASE_URL}/analysis/reports`, {
      params: {
        dataset_name: datasetName,
        type,
        limit
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching analysis reports:', error.message);
    throw new Error('Failed to fetch analysis reports. Please try again.');
  }
};

export const validateDataset = async (datasetName, validationRules = []) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/analysis/validate`, {
      dataset_name: datasetName,
      rules: validationRules
    });

    return response.data;
  } catch (error) {
    console.error('Error validating dataset:', error.message);
    throw new Error('Failed to validate dataset. Please try again.');
  }
};
