import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, Database, AlertCircle } from 'lucide-react';
import { uploadDataset } from '../services/dataService';

const DataUploader = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [customName, setCustomName] = useState('');

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      setCustomName(selectedFile.name.split('.')[0]);
      
      // Create a preview for text files
      if (selectedFile.type === 'text/plain' || selectedFile.type === 'text/csv') {
        const reader = new FileReader();
        reader.onload = () => {
          setFilePreview(reader.result);
        };
        reader.readAsText(selectedFile);
      } else {
        setFilePreview(null);
      }
      
      setUploadError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'text/plain': ['.txt'],
      'application/json': ['.json'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1
  });

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    
    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 10;
          if (newProgress >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return newProgress;
        });
      }, 300);
      
      // Upload the file
      const result = await uploadDataset(file, customName || undefined);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Notify parent component of successful upload
      if (onUploadSuccess) {
        onUploadSuccess(result);
      }
      
      // Reset form after a delay
      setTimeout(() => {
        setFile(null);
        setFilePreview(null);
        setUploadProgress(0);
        setCustomName('');
      }, 2000);
    } catch (error) {
      setUploadError(error.response?.data?.detail || 'Error uploading file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setFile(null);
    setFilePreview(null);
    setUploadError(null);
    setUploadProgress(0);
    setCustomName('');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Data</h2>
      
      {!file ? (
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center">
            <Upload className="h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm font-medium text-gray-900">
              Drag and drop your file here, or click to select
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Support for CSV, TXT, JSON, XLS, XLSX
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-md">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(2)} KB • {file.type || 'Unknown type'}
                </p>
              </div>
            </div>
            <button 
              onClick={handleCancel}
              className="p-1 rounded-full hover:bg-gray-100"
              disabled={isUploading}
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          
          <div className="space-y-3">
            <label htmlFor="customName" className="block text-sm font-medium text-gray-700">
              Dataset Name (optional)
            </label>
            <input
              type="text"
              id="customName"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Enter a custom name for this dataset"
              disabled={isUploading}
            />
          </div>

          {filePreview && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">File Preview:</h3>
              <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-60">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                  {filePreview.length > 2000 
                    ? filePreview.substring(0, 2000) + '...' 
                    : filePreview}
                </pre>
              </div>
            </div>
          )}
          
          {uploadError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <div className="ml-3">
                  <p className="text-sm text-red-700">{uploadError}</p>
                </div>
              </div>
            </div>
          )}
          
          {uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
              disabled={isUploading}
            >
              <Database className="h-4 w-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Upload File'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataUploader;