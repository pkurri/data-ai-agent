from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy.ext.declarative import declarative_base
from contextlib import contextmanager

Base = declarative_base()
engine = None
Session = None

def init_db(config):
    """Initialize database connection."""
    global engine, Session
    
    engine = create_engine(
        config['url'],
        pool_size=config['pool_size'],
        max_overflow=config['max_overflow']
    )
    
    Session = scoped_session(sessionmaker(bind=engine))
    Base.metadata.create_all(engine)

@contextmanager
def get_db_session():
    """Context manager for database sessions."""
    session = Session()
    try:
        yield session
        session.commit()
    except:
        session.rollback()
        raise
    finally:
        session.close()