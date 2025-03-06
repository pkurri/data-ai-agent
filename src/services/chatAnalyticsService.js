import axios from 'axios';

const API_BASE_URL = '/api';

export const askDatasetQuestion = async (datasetName, question) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/chat/ask`, {
      dataset_name: datasetName,
      question: question
    });
    return response.data;
  } catch (error) {
    console.error('Error asking dataset question:', error.message);
    throw new Error('Failed to process question. Please try again.');
  }
};

export const getQueryHistory = async (datasetName, limit = 10) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/chat/history`, {
      params: {
        dataset_name: datasetName,
        limit
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching query history:', error.message);
    throw new Error('Failed to fetch query history.');
  }
};

export const getSuggestedQuestions = async (datasetName) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/chat/suggestions`, {
      params: {
        dataset_name: datasetName
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching suggested questions:', error.message);
    return {
      suggestions: [
        'How many employees are currently active?',
        'How many employees were terminated this year?',
        'What is the average tenure of active employees?'
      ]
    };
  }
};
