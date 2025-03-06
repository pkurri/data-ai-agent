import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'Completed' | 'In Progress' | 'Pending';
  model: string;
  lastUpdated: string;
}

interface StoreState {
  user: User | null;
  recentProjects: Project[];
  updateUser: (user: User) => void;
  addProject: (project: Project) => void;
}

export const useStore = create<StoreState>((set) => ({
  user: {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
  recentProjects: [
    {
      id: '1',
      name: 'Customer Survey Data',
      description: 'Cleaning and analysis of customer feedback survey',
      status: 'Completed',
      model: 'Text Cleaning Pipeline',
      lastUpdated: '2 days ago',
    },
    {
      id: '2',
      name: 'Sales Transactions',
      description: 'Monthly sales data cleaning and normalization',
      status: 'In Progress',
      model: 'Tabular Data Cleaner',
      lastUpdated: '5 hours ago',
    },
    {
      id: '3',
      name: 'Product Reviews',
      description: 'Sentiment analysis and text normalization',
      status: 'Pending',
      model: 'BERT Classifier',
      lastUpdated: '1 week ago',
    },
  ],
  updateUser: (user) => set({ user }),
  addProject: (project) => set((state) => ({ 
    recentProjects: [project, ...state.recentProjects].slice(0, 10)
  })),
}));