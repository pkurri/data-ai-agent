# Data AI Agent

A powerful data analysis and cleaning platform with real-time chat analytics capabilities.

## Features

### 1. Data Storage & Management
- **Hybrid Storage System**
  - File-based storage (Parquet)
  - DB2 database integration
  - SQL Server support
  - Automatic failover between storage types
  - Redis caching for improved performance

### 2. Data Cleaning
- **Text Normalization**
  - Case standardization
  - Extra space removal
  - Format standardization

- **Data Quality**
  - Missing value handling with smart imputation
  - Outlier detection using IQR method
  - Duplicate entry management
  - Configurable cleaning rules

### 3. Real-time Chat Analytics
- Natural language querying of datasets
- Interactive data visualization
- Query history tracking
- Suggested questions based on dataset context
- Near real-time response with caching

### 4. Anomaly Detection
- Statistical outlier detection
- Distribution analysis
- Time series anomaly detection
- Configurable thresholds
- Result caching for performance

## Prerequisites

- Python 3.8+
- Node.js 16+
- DB2 Database
- SQL Server
- Redis Server

## Dependencies

### Backend (Python)
```bash
ibm-db==3.1.5
ibm-db-sa==0.4.0
redis==5.0.1
Flask==2.3.3
Flask-CORS==4.0.0
pandas==2.2.3
scikit-learn==1.6.1
```

### Frontend (Node.js)
```bash
react
axios
recharts
lucide-react
tailwindcss
```

## Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd data-ai-agent
   ```

2. **Set Up Python Environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Configure Databases**
   - Copy `config/database_config.example.py` to `config/database_config.py`
   - Update the configuration with your database credentials:
     ```python
     DB2Config:
       host: your_db2_host
       port: your_db2_port
       database: your_db2_database
       username: your_username
       password: your_password

     SQLServerConfig:
       server: your_sql_server
       database: your_database
       username: your_username
       password: your_password

     RedisConfig:
       host: your_redis_host
       port: your_redis_port
       password: your_redis_password
     ```

4. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   ```

5. **Start the Application**
   
   Backend:
   ```bash
   cd server
   python app.py
   ```

   Frontend:
   ```bash
   cd frontend
   npm start
   ```

   The application will be available at `http://localhost:3000`

## Usage Examples

### 1. Data Cleaning
```python
from agents.cleaning_agent import DataCleaningAgent

cleaner = DataCleaningAgent()
cleaned_data = cleaner.clean_dataset('employee_data.csv', {
    'removeDuplicates': True,
    'handleMissingValues': 'impute',
    'normalizeText': True,
    'detectOutliers': True
})
```

### 2. Chat Analytics
```javascript
// In your React component
import { DatasetChat } from './components/DatasetChat';

function App() {
  return (
    <DatasetChat datasetName="employee_data" />
  );
}
```

Example questions you can ask:
- "How many employees are currently active?"
- "Show me department-wise employee count"
- "What is the average salary by department?"

### 3. Anomaly Detection
```python
from agents.anomaly_agent import AnomalyDetectionAgent

detector = AnomalyDetectionAgent({
    'numeric_columns': ['age', 'salary'],
    'date_columns': ['hire_date'],
    'anomaly_thresholds': {
        'age_zscore': 3.0,
        'salary_zscore': 3.0
    }
})

anomalies = detector.detect_anomalies(data)
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.