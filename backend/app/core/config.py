from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./network_simulator.db"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Network Simulator Backend"
    DEBUG: bool = True
    
    # Security
    SECRET_KEY: str = "change-this-secret-key-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # External AI Service
    AI_SERVICE_URL: str = "https://api.openai.com/v1"
    AI_SERVICE_API_KEY: Optional[str] = None
    
    # Simulation Configuration
    DEFAULT_PACKET_DELAY_MS: int = 100
    MAX_SIMULATION_DURATION_SECONDS: int = 300
    MAX_NODES_PER_SESSION: int = 50
    MAX_CONNECTIONS_PER_SESSION: int = 100
    
    # Anomaly Configuration
    DEFAULT_PACKET_LOSS_RATE: float = 0.05
    DEFAULT_DELAY_VARIANCE_MS: int = 50
    DEFAULT_CORRUPTION_RATE: float = 0.02

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()