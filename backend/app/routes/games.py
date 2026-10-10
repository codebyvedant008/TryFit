from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Request, HTTPException, status

from app.models import GameCreate

router = APIRouter(prefix="/games", tags=["Games"])


def serialize_game(game):
    return {
        "id": str(game["_id"]),
        "title": game["title"],
        "activity": game["activity"],
        "location": game["location"],
        "date": game["date"],
        "time": game["time"],
        "players": game["players"],
        "total": game["total"],
        "host": game["host"],
    }


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_game(game: GameCreate, request: Request):
    db = request.app.state.db

    game_data = game.model_dump()
    game_data["players"] = 1
    game_data["joined_users"] = []
    game_data["created_at"] = datetime.now(timezone.utc)

    result = await db.games.insert_one(game_data)

    game_data["_id"] = result.inserted_id

    return {
        "message": "Game created successfully",
        "game": serialize_game(game_data)
    }


@router.get("/")
async def get_games(request: Request):
    db = request.app.state.db

    games = await db.games.find().sort(
        "created_at", -1
    ).to_list(length=100)

    return [serialize_game(game) for game in games]


@router.post("/{game_id}/join")
async def join_game(game_id: str, request: Request):
    db = request.app.state.db

    if not ObjectId.is_valid(game_id):
        raise HTTPException(status_code=400, detail="Invalid game ID")

    game = await db.games.find_one({"_id": ObjectId(game_id)})

    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    if game["players"] >= game["total"]:
        raise HTTPException(status_code=400, detail="Game is full")

    await db.games.update_one(
        {"_id": ObjectId(game_id)},
        {"$inc": {"players": 1}}
    )

    return {"message": "Joined game successfully"}


@router.post("/{game_id}/leave")
async def leave_game(game_id: str, request: Request):
    db = request.app.state.db

    if not ObjectId.is_valid(game_id):
        raise HTTPException(status_code=400, detail="Invalid game ID")

    game = await db.games.find_one({"_id": ObjectId(game_id)})

    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    if game["players"] <= 1:
        raise HTTPException(
            status_code=400,
            detail="Host cannot leave this demo game"
        )

    await db.games.update_one(
        {"_id": ObjectId(game_id)},
        {"$inc": {"players": -1}}
    )

    return {"message": "Left game successfully"}