from datetime import datetime
from typing import Dict, Any
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float, JSON, ForeignKey
from sqlalchemy.orm import relationship
from storage.database import Base

class Dataset(Base):
    """Dataset model for database storage."""
    __tablename__ = 'datasets'

    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(String)
    file_type = Column(String, nullable=False)
    storage_path = Column(String, nullable=False)
    size_bytes = Column(Integer, nullable=False)
    num_rows = Column(Integer, nullable=False)
    num_columns = Column(Integer, nullable=False)
    column_types = Column(JSON)
    metadata = Column(JSON)
    is_cleaned = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    cleaning_reports = relationship("CleaningReport", back_populates="dataset")
    validation_results = relationship("ValidationResult", back_populates="dataset")
    analytics_reports = relationship("AnalyticsReport", back_populates="dataset")

class CleaningReport(Base):
    """Cleaning report model for database storage."""
    __tablename__ = 'cleaning_reports'

    id = Column(Integer, primary_key=True)
    dataset_id = Column(Integer, ForeignKey('datasets.id'))
    original_rows = Column(Integer, nullable=False)
    final_rows = Column(Integer, nullable=False)
    operations_performed = Column(JSON, nullable=False)
    missing_values_handled = Column(Integer, nullable=False)
    duplicates_removed = Column(Integer, nullable=False)
    outliers_detected = Column(Integer, nullable=False)
    execution_time = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    dataset = relationship("Dataset", back_populates="cleaning_reports")

class ValidationResult(Base):
    """Validation result model for database storage."""
    __tablename__ = 'validation_results'

    id = Column(Integer, primary_key=True)
    dataset_id = Column(Integer, ForeignKey('datasets.id'))
    is_valid = Column(Boolean, nullable=False)
    errors = Column(JSON)
    warnings = Column(JSON)
    schema_validation = Column(JSON)
    data_quality_score = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

    dataset = relationship("Dataset", back_populates="validation_results")

class AnalyticsReport(Base):
    """Analytics report model for database storage."""
    __tablename__ = 'analytics_reports'

    id = Column(Integer, primary_key=True)
    dataset_id = Column(Integer, ForeignKey('datasets.id'))
    total_rows = Column(Integer, nullable=False)
    total_columns = Column(Integer, nullable=False)
    missing_values = Column(JSON)
    duplicates = Column(JSON)
    column_types = Column(JSON)
    numeric_stats = Column(JSON)
    categorical_stats = Column(JSON)
    correlation_matrix = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

    dataset = relationship("Dataset", back_populates="analytics_reports")

class ProcessingJob(Base):
    """Processing job model for database storage."""
    __tablename__ = 'processing_jobs'

    id = Column(Integer, primary_key=True)
    job_id = Column(String, unique=True, nullable=False)
    dataset_id = Column(Integer, ForeignKey('datasets.id'))
    operation_type = Column(String, nullable=False)
    status = Column(String, nullable=False, default='pending')
    progress = Column(Float, nullable=False, default=0.0)
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    error_message = Column(String)
    result = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    dataset = relationship("Dataset")

class User(Base):
    """User model for database storage."""
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    preferences = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class DatasetPermission(Base):
    """Dataset permission model for database storage."""
    __tablename__ = 'dataset_permissions'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    dataset_id = Column(Integer, ForeignKey('datasets.id'))
    can_read = Column(Boolean, default=True)
    can_write = Column(Boolean, default=False)
    can_delete = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User")
    dataset = relationship("Dataset")