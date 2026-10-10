from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import database, connect_database, close_database
from app.routes import users, activities, games, connections, auth, chat, safety


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_database()
    await database.users.create_index("email", unique=True)
    app.state.db = database
    print("TryFit backend started successfully!")
    yield
    await close_database()


app = FastAPI(
    title="TryFit API",
    description="Backend API for TryFit",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
       "https://try-fit-ruddy.vercel.app",
       "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.get("/")
async def home():
    return {"message": "Welcome to TryFit API!", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


app.include_router(users.router)
app.include_router(activities.router)
app.include_router(games.router)
app.include_router(connections.router)
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(safety.router)