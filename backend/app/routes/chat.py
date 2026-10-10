from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Request, HTTPException, status
from pydantic import BaseModel, Field

router = APIRouter(prefix="/messages", tags=["Messages"])


class MessageCreate(BaseModel):
    sender_id: str
    receiver_id: str
    text: str = Field(min_length=1, max_length=2000)


async def find_connection(db, user_a: str, user_b: str):
    return await db.connections.find_one(
        {
            "$or": [
                {"sender_id": user_a, "receiver_id": user_b},
                {"sender_id": user_b, "receiver_id": user_a},
            ],
            "status": {"$in": ["accepted", "connected"]},
        }
    )


@router.get("/{partner_id}")
async def get_messages(partner_id: str, user_id: str, request: Request):
    db = request.app.state.db
    user_id = str(user_id).strip()
    partner_id = str(partner_id).strip()

    connection = await find_connection(db, user_id, partner_id)
    if not connection:
        raise HTTPException(
            status_code=403,
            detail="You can only chat with a connected fitness match.",
        )

    messages = await db.messages.find(
        {
            "$or": [
                {"sender_id": user_id, "receiver_id": partner_id},
                {"sender_id": partner_id, "receiver_id": user_id},
            ]
        }
    ).sort("created_at", 1).to_list(length=200)

    return [
        {
            "id": str(message["_id"]),
            "sender_id": message["sender_id"],
            "receiver_id": message["receiver_id"],
            "text": message["text"],
            "created_at": message["created_at"].isoformat(),
        }
        for message in messages
    ]


@router.post("/", status_code=status.HTTP_201_CREATED)
async def send_message(message: MessageCreate, request: Request):
    db = request.app.state.db

    sender_id = str(message.sender_id).strip()
    receiver_id = str(message.receiver_id).strip()
    text = message.text.strip()

    if not sender_id or not receiver_id:
        raise HTTPException(status_code=400, detail="Sender and receiver are required.")

    if sender_id == receiver_id:
        raise HTTPException(status_code=400, detail="You cannot message yourself.")

    if not text:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    connection = await find_connection(db, sender_id, receiver_id)
    if not connection:
        raise HTTPException(
            status_code=403,
            detail="You can only message a connected fitness match.",
        )

    message_data = {
        "sender_id": sender_id,
        "receiver_id": receiver_id,
        "text": text,
        "created_at": datetime.now(timezone.utc),
    }

    result = await db.messages.insert_one(message_data)

    return {
        "message": "Message sent successfully",
        "id": str(result.inserted_id),
        "sender_id": sender_id,
        "receiver_id": receiver_id,
        "text": text,
        "created_at": message_data["created_at"].isoformat(),
    }