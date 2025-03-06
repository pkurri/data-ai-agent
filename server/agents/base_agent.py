from abc import ABC, abstractmethod

class BaseAgent(ABC):
    """Base class for all agents."""
    
    @abstractmethod
    def initialize(self):
        """Initialize the agent."""
        pass
    
    @abstractmethod
    def process(self, data):
        """Process the data."""
        pass
    
    @abstractmethod
    def cleanup(self):
        """Clean up resources."""
        pass