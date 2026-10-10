import os
from datetime import datetime, timezone

from fastapi import APIRouter, Request, HTTPException
from google.auth.transport import requests
from google.oauth2 import id_token
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/auth", tags=["Authentication"])

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")


@router.post("/google")
async def google_login(payload: dict, request: Request):
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=500,
            detail="GOOGLE_CLIENT_ID is not configured.",
        )

    credential = payload.get("credential")

    if not credential:
        raise HTTPException(
            status_code=400,
            detail="Google credential is required.",
        )

    try:
        google_user = id_token.verify_oauth2_token(
            credential,
            requests.Request(),
            GOOGLE_CLIENT_ID,
        )
    except ValueError:
        raise HTTPException(
            status_code=401,
            detail="Invalid Google credential.",
        )

    google_id = google_user.get("sub")
    email = google_user.get("email")
    name = google_user.get("name") or "TryFit User"
    picture = google_user.get("picture", "")

    if not google_id or not email:
        raise HTTPException(
            status_code=400,
            detail="Google account information is incomplete.",
        )

    db = request.app.state.db

    existing_user = await db.users.find_one(
        {
            "$or": [
                {"google_id": google_id},
                {"email": email.lower()},
            ]
        }
    )

    if existing_user:
        await db.users.update_one(
            {"_id": existing_user["_id"]},
            {
                "$set": {
                    "google_id": google_id,
                    "google_picture": picture,
                    "name": name,
                    "email": email.lower(),
                    "last_login": datetime.now(timezone.utc),
                }
            },
        )

        user = await db.users.find_one(
            {"_id": existing_user["_id"]}
        )

    else:
        user_data = {
            "_id": google_id,
            "google_id": google_id,
            "google_picture": picture,
            "name": name,
            "email": email.lower(),
            "age": 18,
            "city": "",
            "activity": "Running",
            "level": "Beginner",
            "availability": "Flexible",
            "bio": "",
            "created_at": datetime.now(timezone.utc),
            "last_login": datetime.now(timezone.utc),
        }

        try:
            await db.users.insert_one(user_data)
        except Exception:
            raise HTTPException(
                status_code=409,
                detail="Could not create Google account.",
            )

        user = user_data

    return {
        "message": "Google login successful",
        "user": {
            "id": str(user["_id"]),
            "name": user.get("name", ""),
            "email": user.get("email", ""),
            "age": user.get("age", 18),
            "city": user.get("city", ""),
            "activity": user.get("activity", "Running"),
            "level": user.get("level", "Beginner"),
            "availability": user.get("availability", "Flexible"),
            "bio": user.get("bio", ""),
            "google_picture": user.get("google_picture", ""),
        },
    } 
import os
from datetime import datetime, timezone

from fastapi import APIRouter, Request, HTTPException
from google.auth.transport import requests
from google.oauth2 import id_token
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/auth", tags=["Authentication"])

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")


@router.post("/google")
async def google_login(payload: dict, request: Request):
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=500,
            detail="GOOGLE_CLIENT_ID is not configured.",
        )

    credential = payload.get("credential")

    if not credential:
        raise HTTPException(
            status_code=400,
            detail="Google credential is required.",
        )

    try:
        google_user = id_token.verify_oauth2_token(
            credential,
            requests.Request(),
            GOOGLE_CLIENT_ID,
        )
    except ValueError:
        raise HTTPException(
            status_code=401,
            detail="Invalid Google credential.",
        )

    google_id = google_user.get("sub")
    email = google_user.get("email")
    name = google_user.get("name") or "TryFit User"
    picture = google_user.get("picture", "")

    if not google_id or not email:
        raise HTTPException(
            status_code=400,
            detail="Google account information is incomplete.",
        )

    db = request.app.state.db

    existing_user = await db.users.find_one(
        {
            "$or": [
                {"google_id": google_id},
                {"email": email.lower()},
            ]
        }
    )

    if existing_user:
        await db.users.update_one(
            {"_id": existing_user["_id"]},
            {
                "$set": {
                    "google_id": google_id,
                    "google_picture": picture,
                    "name": name,
                    "email": email.lower(),
                    "last_login": datetime.now(timezone.utc),
                }
            },
        )

        user = await db.users.find_one(
            {"_id": existing_user["_id"]}
        )

    else:
        user_data = {
            "_id": google_id,
            "google_id": google_id,
            "google_picture": picture,
            "name": name,
            "email": email.lower(),
            "age": 18,
            "city": "",
            "activity": "Running",
            "level": "Beginner",
            "availability": "Flexible",
            "bio": "",
            "created_at": datetime.now(timezone.utc),
            "last_login": datetime.now(timezone.utc),
        }

        try:
            await db.users.insert_one(user_data)
        except Exception:
            raise HTTPException(
                status_code=409,
                detail="Could not create Google account.",
            )

        user = user_data

    return {
        "message": "Google login successful",
        "user": {
            "id": str(user["_id"]),
            "name": user.get("name", ""),
            "email": user.get("email", ""),
            "age": user.get("age", 18),
            "city": user.get("city", ""),
            "activity": user.get("activity", "Running"),
            "level": user.get("level", "Beginner"),
            "availability": user.get("availability", "Flexible"),
            "bio": user.get("bio", ""),
            "google_picture": user.get("google_picture", ""),
        },
    }