# Data Cleaning Agent

A comprehensive data cleaning solution with a React frontend and Python backend, leveraging Hugging Face models for advanced data processing.

## Features

- Modern React UI with a Facebook-like interface
- Data cleaning and processing capabilities
- Integration with Hugging Face models
- File upload and processing
- Data visualization and export
- User settings and preferences

## Tech Stack

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- React Router
- React Query
- Zustand (state management)
- Lucide React (icons)
- React Dropzone (file uploads)

### Backend
- Python
- Flask
- Pandas
- NumPy
- scikit-learn
- Hugging Face Inference API

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/data-cleaning-agent.git
cd data-cleaning-agent
```

2. Install frontend dependencies
```bash
npm install
```

3. Install backend dependencies
```bash
cd server
pip install -r requirements.txt
```

### Running the Application

1. Start the frontend development server
```bash
npm run dev
```

2. Start the backend server (in a separate terminal)
```bash
cd server
python app.py
```

3. Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
data-cleaning-agent/
├── public/                  # Static assets
├── server/                  # Python backend
│   ├── app.py               # Flask application
│   └── requirements.txt     # Python dependencies
├── src/
│   ├── components/          # Reusable UI components
│   ├── hooks/               # Custom React hooks
│   ├── pages/               # Application pages
│   ├── store/               # State management
│   ├── App.tsx              # Main application component
│   └── main.tsx             # Application entry point
├── package.json             # Frontend dependencies
└── README.md                # Project documentation
```

## API Endpoints

- `GET /api/health` - Health check endpoint
- `POST /api/clean` - Data cleaning endpoint

## License

This project is licensed under the MIT License - see the LICENSE file for details.