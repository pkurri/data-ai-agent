from dataclasses import dataclass
from typing import Dict, List, Optional, Any
from datetime import datetime

@dataclass
class DatasetMetadata:
    """Metadata for a dataset."""
    name: str
    description: Optional[str] = None
    created_at: datetime = datetime.now()
    updated_at: datetime = datetime.now()
    file_type: str = 'csv'
    size_bytes: int = 0
    num_rows: int = 0
    num_columns: int = 0
    column_types: Dict[str, str] = None
    tags: List[str] = None

@dataclass
class CleaningOptions:
    """Options for data cleaning operations."""
    remove_duplicates: bool = True
    handle_missing_values: str = 'impute'  # 'impute', 'remove', or 'fill'
    normalize_text: bool = True
    detect_outliers: bool = True
    fix_typos: bool = False
    custom_options: Dict[str, Any] = None

@dataclass
class CleaningReport:
    """Report of cleaning operations performed."""
    dataset_name: str
    original_rows: int
    final_rows: int
    operations_performed: List[Dict[str, Any]]
    missing_values_handled: int
    duplicates_removed: int
    outliers_detected: int
    execution_time: float
    created_at: datetime = datetime.now()

@dataclass
class ValidationResult:
    """Result of dataset validation."""
    is_valid: bool
    errors: List[str]
    warnings: List[str]
    schema_validation: Dict[str, bool]
    data_quality_score: float
    created_at: datetime = datetime.now()

@dataclass
class AnalyticsReport:
    """Analytics report for a dataset."""
    dataset_name: str
    total_rows: int
    total_columns: int
    missing_values: Dict[str, int]
    duplicates: Dict[str, float]
    column_types: Dict[str, str]
    numeric_stats: Dict[str, Dict[str, float]]
    categorical_stats: Dict[str, Dict[str, Any]]
    correlation_matrix: Optional[Dict[str, Dict[str, float]]] = None
    created_at: datetime = datetime.now()

@dataclass
class ProcessingJob:
    """Data processing job information."""
    job_id: str
    dataset_name: str
    operation_type: str
    status: str = 'pending'  # 'pending', 'running', 'completed', 'failed'
    progress: float = 0.0
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    error_message: Optional[str] = None
    result: Optional[Dict[str, Any]] = None