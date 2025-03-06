import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  Clock, 
  Database,
  BarChart2,
  Loader,
  AlertCircle
} from 'lucide-react';
import { 
  askDatasetQuestion, 
  getQueryHistory, 
  getSuggestedQuestions 
} from '../services/chatAnalyticsService';

const DatasetChat = ({ datasetName }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    loadSuggestions();
    loadHistory();
    scrollToBottom();
  }, [datasetName]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadSuggestions = async () => {
    try {
      const { suggestions } = await getSuggestedQuestions(datasetName);
      setSuggestions(suggestions);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const loadHistory = async () => {
    try {
      const { history } = await getQueryHistory(datasetName);
      if (history && history.length > 0) {
        setMessages(history.map(item => ({
          type: 'qa',
          question: item.query,
          answer: item.result,
          timestamp: item.timestamp
        })));
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const question = inputValue.trim();
    setInputValue('');
    setLoading(true);
    setError(null);

    try {
      const newMessage = {
        type: 'qa',
        question,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, newMessage]);

      const response = await askDatasetQuestion(datasetName, question);
      
      setMessages(prev => prev.map(msg => 
        msg === newMessage 
          ? { ...msg, answer: response.data } 
          : msg
      ));
    } catch (err) {
      setError(err.message);
      setMessages(prev => prev.map(msg => 
        msg.question === question 
          ? { ...msg, error: err.message } 
          : msg
      ));
    } finally {
      setLoading(false);
    }
  };

  const renderResult = (result) => {
    if (!result || !result.data) return null;

    if (Array.isArray(result.data)) {
      return (
        <div className="bg-white rounded-lg shadow p-4 mt-2">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(result.data[0] || {}).map(key => (
                    <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {result.data.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((value, j) => (
                      <td key={j} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {result.metadata && (
            <div className="mt-2 text-sm text-gray-500">
              {result.metadata.row_count} results found
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow p-4 mt-2">
        <pre className="text-sm text-gray-700 whitespace-pre-wrap">
          {JSON.stringify(result.data, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full max-h-[800px] bg-gray-50 rounded-lg shadow-lg">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Database className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">{datasetName}</h2>
        </div>
        <button 
          onClick={loadHistory}
          className="text-gray-400 hover:text-gray-600"
          title="Reload history"
        >
          <Clock className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0">
                <MessageSquare className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <p className="text-gray-900">{message.question}</p>
                {message.error ? (
                  <div className="mt-2 text-red-600 text-sm flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {message.error}
                  </div>
                ) : message.answer ? (
                  renderResult(message.answer)
                ) : loading ? (
                  <div className="mt-2 flex items-center text-gray-500">
                    <Loader className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {suggestions.length > 0 && messages.length === 0 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Suggested questions:</h3>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setInputValue(suggestion)}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="px-6 py-4 border-t border-gray-200">
        <div className="flex space-x-4">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask a question about your dataset..."
            className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={loading || !inputValue.trim()}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? (
              <Loader className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DatasetChat;
