'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Database, X, Check } from 'lucide-react';

export const UploadData: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/json': ['.json'],
      'application/xml': ['.xml']
    },
    maxSize: 10485760 // 10MB
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    // TODO: Implement actual file upload logic
    // This would involve sending files to the server and processing them
  };

  const getFileIcon = (type: string) => {
    if (type.includes('csv')) return <FileText className="h-5 w-5 text-green-600" />;
    if (type.includes('json')) return <FileText className="h-5 w-5 text-yellow-600" />;
    if (type.includes('xml')) return <FileText className="h-5 w-5 text-blue-600" />;
    return <FileText className="h-5 w-5 text-gray-600" />;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Upload Data
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Upload CSV, JSON, or XML files to import into your graph database
        </p>
      </div>

      {/* Upload Zone */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Drop Zone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-primary-500'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            or click to select files
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Supports CSV, JSON, XML files (max 10MB each)
          </p>
        </div>

        {/* File List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Selected Files ({files.length})
          </h3>
          
          {files.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No files selected yet
            </p>
          ) : (
            <div className="space-y-3">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {getFileIcon(file.type)}
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {files.length > 0 && (
            <div className="mt-6">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full btn btn-primary"
              >
                {uploading ? 'Uploading...' : 'Start Upload'}
              </button>
              
              {uploading && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
                    {uploadProgress}% complete
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-3">
          📋 Upload Instructions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
          <div>
            <h4 className="font-medium mb-2">CSV Format:</h4>
            <ul className="space-y-1">
              <li>• First row should contain headers</li>
              <li>• Use commas as separators</li>
              <li>• Include node/relationship identifiers</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">JSON Format:</h4>
            <ul className="space-y-1">
              <li>• Array of objects structure</li>
              <li>• Include type information</li>
              <li>• Support for nested properties</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};