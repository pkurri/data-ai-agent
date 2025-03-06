import React from 'react';
import { BarChart, PieChart, ArrowUpRight, Database, Sparkles, AlertCircle } from 'lucide-react';
import { useStore } from '../store';

const Dashboard = () => {
  const { recentProjects } = useStore();

  const stats = [
    { name: 'Total Datasets', value: '24', icon: <Database size={20} />, change: '+12%', color: 'bg-blue-500' },
    { name: 'Active Models', value: '8', icon: <Sparkles size={20} />, change: '+3', color: 'bg-purple-500' },
    { name: 'Data Issues Fixed', value: '1,284', icon: <AlertCircle size={20} />, change: '+24%', color: 'bg-green-500' },
    { name: 'Processing Time Saved', value: '48h', icon: <BarChart size={20} />, change: '+8h', color: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            New Project
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-md ${stat.color}`}>
                <span className="text-white">{stat.icon}</span>
              </div>
              <span className="text-sm font-medium text-green-600 flex items-center">
                {stat.change}
                <ArrowUpRight size={16} className="ml-1" />
              </span>
            </div>
            <p className="mt-4 text-2xl font-semibold text-gray-800">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.name}</p>
          </div>
        ))}
      </div>

      {/* Recent Projects */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Recent Projects</h2>
          <button className="text-blue-600 text-sm hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentProjects.map((project) => (
                <tr key={project.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{project.name}</div>
                        <div className="text-sm text-gray-500">{project.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      project.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                      project.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.model}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.lastUpdated}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                    <button className="text-gray-600 hover:text-gray-900">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500 text-sm">U{i}</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-800">
                    <span className="font-medium">User {i}</span> {' '}
                    {i % 2 === 0 ? 'cleaned dataset' : 'applied model to'} {' '}
                    <span className="font-medium">Project {i}</span>
                  </p>
                  <p className="text-xs text-gray-500">{i * 2} hours ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recommended Models</h2>
          <div className="space-y-4">
            {[
              { name: 'BERT for Text Classification', type: 'NLP', accuracy: '94%' },
              { name: 'ResNet for Image Recognition', type: 'Computer Vision', accuracy: '92%' },
              { name: 'XGBoost for Tabular Data', type: 'ML', accuracy: '89%' },
              { name: 'GPT-2 for Text Generation', type: 'NLP', accuracy: '91%' },
            ].map((model, i) => (
              <div key={i} className="flex items-center justify-between p-3 border border-gray-100 rounded-md hover:bg-gray-50">
                <div>
                  <h3 className="text-sm font-medium text-gray-800">{model.name}</h3>
                  <p className="text-xs text-gray-500">{model.type}</p>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-green-600">{model.accuracy}</span>
                  <button className="ml-4 text-blue-600 hover:text-blue-800">
                    <ArrowUpRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;