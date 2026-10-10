import os
import certifi
from dotenv import load_dotenv
from pymongo import AsyncMongoClient

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
DB_NAME = os.getenv("DB_NAME", "tryfit")

if not MONGODB_URL:
    raise RuntimeError("MONGODB_URL is missing. Check your .env file.")

client = AsyncMongoClient(
    MONGODB_URL,
    tls=True,
    tlsCAFile=certifi.where(),
    serverSelectionTimeoutMS=30000,
)

database = client[DB_NAME]


async def connect_database():
    await client.admin.command("ping")
    print("MongoDB connected successfully!")


async def close_database():
    await client.close()
    print("MongoDB connection closed.")