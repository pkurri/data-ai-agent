import React, { useState, useEffect } from 'react';
import { Search, Filter, Sparkles, ArrowUpRight, Star, Download, RefreshCw } from 'lucide-react';
import { HfInference } from '@huggingface/inference';
import { initializeHuggingFace } from '../services/huggingFaceService';

const ModelHub = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTask, setSelectedTask] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [models, setModels] = useState([]);
  const [error, setError] = useState(null);

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'nlp', name: 'Natural Language Processing' },
    { id: 'cv', name: 'Computer Vision' },
    { id: 'tabular', name: 'Tabular Data' },
    { id: 'audio', name: 'Audio Processing' },
  ];

  const tasks = [
    { id: 'all', name: 'All Tasks' },
    { id: 'classification', name: 'Classification' },
    { id: 'regression', name: 'Regression' },
    { id: 'clustering', name: 'Clustering' },
    { id: 'text-generation', name: 'Text Generation' },
    { id: 'translation', name: 'Translation' },
    { id: 'summarization', name: 'Summarization' },
    { id: 'image-classification', name: 'Image Classification' },
    { id: 'object-detection', name: 'Object Detection' },
  ];

  // Sample models data - in a real app, this would come from an API
  const sampleModels = [
    {
      id: 1,
      name: 'BERT Base',
      category: 'nlp',
      task: 'classification',
      description: 'Bidirectional Encoder Representations from Transformers for text classification and NLP tasks.',
      stars: 4.8,
      downloads: '25K',
      author: 'Hugging Face',
      lastUpdated: '2 months ago',
    },
    {
      id: 2,
      name: 'GPT-2 Small',
      category: 'nlp',
      task: 'text-generation',
      description: 'OpenAI\'s GPT-2 model for text generation and completion tasks.',
      stars: 4.9,
      downloads: '42K',
      author: 'OpenAI',
      lastUpdated: '3 months ago',
    },
    {
      id: 3,
      name: 'ResNet-50',
      category: 'cv',
      task: 'image-classification',
      description: 'Residual Network with 50 layers for image classification tasks.',
      stars: 4.7,
      downloads: '18K',
      author: 'Microsoft Research',
      lastUpdated: '5 months ago',
    },
    {
      id: 4,
      name: 'XGBoost Classifier',
      category: 'tabular',
      task: 'classification',
      description: 'Gradient boosting algorithm optimized for tabular data classification.',
      stars: 4.6,
      downloads: '31K',
      author: 'DMLC',
      lastUpdated: '1 month ago',
    },
    {
      id: 5,
      name: 'Wav2Vec 2.0',
      category: 'audio',
      task: 'classification',
      description: 'Self-supervised learning model for speech recognition and audio processing.',
      stars: 4.5,
      downloads: '12K',
      author: 'Facebook AI',
      lastUpdated: '4 months ago',
    },
    {
      id: 6,
      name: 'T5 Base',
      category: 'nlp',
      task: 'summarization',
      description: 'Text-to-Text Transfer Transformer for text summarization and other NLP tasks.',
      stars: 4.7,
      downloads: '19K',
      author: 'Google Research',
      lastUpdated: '2 months ago',
    },
    {
      id: 7,
      name: 'DistilBERT',
      category: 'nlp',
      task: 'classification',
      description: 'A distilled version of BERT that is smaller, faster, and retains 97% of its language understanding capabilities.',
      stars: 4.6,
      downloads: '22K',
      author: 'Hugging Face',
      lastUpdated: '3 months ago',
    },
    {
      id: 8,
      name: 'YOLO v5',
      category: 'cv',
      task: 'object-detection',
      description: 'You Only Look Once - real-time object detection system optimized for speed and accuracy.',
      stars: 4.9,
      downloads: '38K',
      author: 'Ultralytics',
      lastUpdated: '1 month ago',
    },
    {
      id: 9,
      name: 'LightGBM',
      category: 'tabular',
      task: 'regression',
      description: 'A gradient boosting framework that uses tree-based learning algorithms for tabular data.',
      stars: 4.5,
      downloads: '15K',
      author: 'Microsoft',
      lastUpdated: '4 months ago',
    }
  ];

  useEffect(() => {
    // In a real app, you would fetch models from an API
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setModels(sampleModels);
      setIsLoading(false);
    }, 1000);
    
    // Initialize Hugging Face client
    try {
      initializeHuggingFace();
    } catch (error) {
      console.error('Error initializing Hugging Face client:', error);
    }
  }, []);

  const filteredModels = models.filter(model => {
    const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          model.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || model.category === selectedCategory;
    const matchesTask = selectedTask === 'all' || model.task === selectedTask;
    
    return matchesSearch && matchesCategory && matchesTask;
  });

  const handleUseModel = (model) => {
    // In a real app, this would add the model to the user's workspace or redirect to a model detail page
    alert(`Model "${model.name}" selected for use. In a real app, this would add the model to your workspace.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Model Hub</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center">
          <Sparkles size={16} className="mr-2" />
          Add Custom Model
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search models by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-full md:w-48">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter size={18} className="text-gray-400" />
                </div>
                <select
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="w-full md:w-48">
              <select
                className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedTask}
                onChange={(e) => setSelectedTask(e.target.value)}
              >
                {tasks.map(task => (
                  <option key={task.id} value={task.id}>{task.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Models Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
          <span className="ml-2 text-gray-600">Loading models...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModels.map(model => (
            <div key={model.id} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold text-gray-900">{model.name}</h3>
                  <div className="flex items-center">
                    <Star size={16} className="text-yellow-400" />
                    <span className="ml-1 text-sm text-gray-600">{model.stars}</span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-500">{model.description}</p>
                
                <div className="mt-4 flex items-center text-xs text-gray-500">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {categories.find(c => c.id === model.category)?.name}
                  </span>
                  <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    {tasks.find(t => t.id === model.task)?.name}
                  </span>
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    <p>By {model.author}</p>
                    <p>Updated {model.lastUpdated}</p>
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <Download size={14} className="mr-1" />
                    <span>{model.downloads}</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
                  <button className="text-blue-600 text-sm font-medium hover:text-blue-800">
                    View Details
                  </button>
                  <button 
                    className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-blue-700 flex items-center"
                    onClick={() => handleUseModel(model)}
                  >
                    Use Model
                    <ArrowUpRight size={14} className="ml-1" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && filteredModels.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-500">No models found matching your criteria. Try adjusting your filters.</p>
        </div>
      )}
    </div>
  );
};

export default ModelHub;