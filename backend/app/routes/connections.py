
from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId

from fastapi import APIRouter, Request, HTTPException, status

from app.models import ConnectionCreate


router = APIRouter(
    prefix="/connections",
    tags=["Connections"]
)


# --------------------------------------------------
# FIND USER BY ID
# --------------------------------------------------

async def find_user_by_id(db, user_id: str):

    user = await db.users.find_one({"_id": user_id})

    if user:
        return user

    users = await db.users.find().to_list(length=1000)

    for user in users:

        stored_id = str(user.get("_id", ""))

        if stored_id == str(user_id):
            return user

        if str(user.get("id", "")) == str(user_id):
            return user

    return None


# --------------------------------------------------
# FIND CONNECTION BY ID
# --------------------------------------------------

async def find_connection_by_id(db, connection_id: str):

    try:
        object_id = ObjectId(connection_id)

    except (InvalidId, TypeError):

        raise HTTPException(
            status_code=400,
            detail="Invalid connection ID"
        )

    connection = await db.connections.find_one(
        {"_id": object_id}
    )

    if not connection:

        raise HTTPException(
            status_code=404,
            detail="Connection request not found"
        )

    return connection


# --------------------------------------------------
# SERIALIZE CONNECTION
# --------------------------------------------------

def serialize_connection(connection):

    return {
        "id": str(connection["_id"]),
        "sender_id": connection["sender_id"],
        "receiver_id": connection["receiver_id"],
        "status": connection["status"]
    }


# --------------------------------------------------
# SEND CONNECTION REQUEST
# --------------------------------------------------

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_connection(
    connection: ConnectionCreate,
    request: Request
):

    db = request.app.state.db

    sender_id = str(connection.sender_id).strip()
    receiver_id = str(connection.receiver_id).strip()

    # Prevent connecting with yourself

    if sender_id == receiver_id:

        raise HTTPException(
            status_code=400,
            detail="You cannot connect with yourself"
        )

    # Verify sender

    sender = await find_user_by_id(db, sender_id)

    if not sender:

        raise HTTPException(
            status_code=404,
            detail="Sender user not found"
        )

    # Verify receiver

    receiver = await find_user_by_id(db, receiver_id)

    if not receiver:

        raise HTTPException(
            status_code=404,
            detail="Receiver user not found"
        )

    # Check existing request in the same direction

    existing = await db.connections.find_one({
        "sender_id": sender_id,
        "receiver_id": receiver_id
    })

    # If previously rejected, allow a new request

    if existing:

        if existing["status"] == "rejected":

            await db.connections.update_one(
                {"_id": existing["_id"]},
                {
                    "$set": {
                        "status": "pending",
                        "created_at": datetime.now(timezone.utc)
                    },
                    "$unset": {
                        "responded_at": ""
                    }
                }
            )

            return {
                "message": "Connection request sent successfully",
                "id": str(existing["_id"]),
                "sender_id": sender_id,
                "receiver_id": receiver_id,
                "status": "pending"
            }

        # Block duplicate pending or accepted requests

        raise HTTPException(
            status_code=409,
            detail="Connection request already exists"
        )

    # Create a new request

    connection_data = {
        "sender_id": sender_id,
        "receiver_id": receiver_id,
        "status": "pending",
        "created_at": datetime.now(timezone.utc)
    }

    result = await db.connections.insert_one(connection_data)

    return {
        "message": "Connection request sent successfully",
        "id": str(result.inserted_id),
        "sender_id": sender_id,
        "receiver_id": receiver_id,
        "status": "pending"
    }


# --------------------------------------------------
# GET ALL CONNECTIONS
# --------------------------------------------------

@router.get("/")
async def get_connections(request: Request):

    db = request.app.state.db

    connections = await db.connections.find().to_list(length=100)

    return [
        serialize_connection(connection)
        for connection in connections
    ]


# --------------------------------------------------
# ACCEPT CONNECTION REQUEST
# --------------------------------------------------

@router.post("/{connection_id}/accept")
async def accept_connection(
    connection_id: str,
    request: Request,
    user_id: str
):

    db = request.app.state.db

    connection = await find_connection_by_id(
        db,
        connection_id
    )

    # Only receiver can accept

    if str(connection["receiver_id"]) != str(user_id):

        raise HTTPException(
            status_code=403,
            detail="Only the receiver can accept this request"
        )

    # Only pending requests can be accepted

    if connection["status"] != "pending":

        raise HTTPException(
            status_code=400,
            detail="This request is no longer pending"
        )

    await db.connections.update_one(
        {"_id": connection["_id"]},
        {
            "$set": {
                "status": "accepted",
                "responded_at": datetime.now(timezone.utc)
            }
        }
    )

    return {
        "message": "Connection request accepted",
        "id": str(connection["_id"]),
        "status": "accepted"
    }


# --------------------------------------------------
# REJECT CONNECTION REQUEST
# --------------------------------------------------

@router.post("/{connection_id}/reject")
async def reject_connection(
    connection_id: str,
    request: Request,
    user_id: str
):

    db = request.app.state.db

    connection = await find_connection_by_id(
        db,
        connection_id
    )

    # Only receiver can reject

    if str(connection["receiver_id"]) != str(user_id):

        raise HTTPException(
            status_code=403,
            detail="Only the receiver can reject this request"
        )

    # Only pending requests can be rejected

    if connection["status"] != "pending":

        raise HTTPException(
            status_code=400,
            detail="This request is no longer pending"
        )

    await db.connections.update_one(
        {"_id": connection["_id"]},
        {
            "$set": {
                "status": "rejected",
                "responded_at": datetime.now(timezone.utc)
            }
        }
    )

    return {
        "message": "Connection request rejected",
        "id": str(connection["_id"]),
        "status": "rejected"
    }
