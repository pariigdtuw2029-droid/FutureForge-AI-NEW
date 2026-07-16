from dotenv import load_dotenv
import os

# Load .env file
load_dotenv()


class Settings:
    """
    Application configuration.
    Reads values from .env
    """

    MONGODB_URL = os.getenv("MONGODB_URL")
    DATABASE_NAME = os.getenv("DATABASE_NAME")

    SECRET_KEY = os.getenv("SECRET_KEY")

    ALGORITHM = "HS256"

    ACCESS_TOKEN_EXPIRE_MINUTES = 60


settings = Settings()