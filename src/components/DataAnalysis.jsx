import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { AlertCircle, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { analyzeDataset, getAnalysisReports } from '../services/analysisService';

const DataAnalysis = ({ datasetName, storageType = 'hybrid' }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [analysisOptions, setAnalysisOptions] = useState({
    analysisType: 'all',
    useCache: true,
    numericColumns: [],
    dateColumns: [],
    timeSeriesColumns: []
  });

  const handleAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);

      const results = await analyzeDataset(datasetName, {
        ...analysisOptions,
        storageType
      });

      setAnalysisResults(results.results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderAnomalyChart = (anomalies) => {
    if (!anomalies || anomalies.length === 0) return null;

    const chartData = anomalies.map(anomaly => ({
      column: anomaly.column,
      count: anomaly.outlier_count || 0,
      type: anomaly.method
    }));

    return (
      <div className="mt-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Anomaly Distribution</h3>
        <div className="bg-white p-4 rounded-lg shadow">
          <BarChart width={600} height={300} data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="column" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#4F46E5" name="Anomaly Count" />
          </BarChart>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Data Analysis</h2>
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-500">{datasetName}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Analysis Type</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={analysisOptions.analysisType}
              onChange={(e) => setAnalysisOptions(prev => ({ ...prev, analysisType: e.target.value }))}
            >
              <option value="all">All Analysis</option>
              <option value="anomalies">Anomalies Only</option>
              <option value="distribution">Distribution Only</option>
              <option value="time_series">Time Series Only</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Cache Settings</label>
            <div className="mt-2">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  checked={analysisOptions.useCache}
                  onChange={(e) => setAnalysisOptions(prev => ({ ...prev, useCache: e.target.checked }))}
                />
                <span className="ml-2 text-sm text-gray-600">Use Redis Cache</span>
              </label>
            </div>
          </div>
        </div>

        <button
          onClick={handleAnalysis}
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? (
            <>
              <RefreshCw className="animate-spin h-5 w-5 mr-2" />
              Analyzing...
            </>
          ) : (
            'Run Analysis'
          )}
        </button>

        {error && (
          <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {analysisResults && (
          <div className="mt-6 space-y-6">
            {analysisResults.anomalies && renderAnomalyChart(analysisResults.anomalies)}
            
            {analysisResults.distribution_analysis && (
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Distribution Analysis</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(analysisResults.distribution_analysis, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {analysisResults.time_series_analysis && (
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Time Series Analysis</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(analysisResults.time_series_analysis, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataAnalysis;
