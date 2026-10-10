from datetime import datetime, timezone

from fastapi import APIRouter, Request, HTTPException, status
from pydantic import BaseModel, Field

router = APIRouter(prefix="/safety", tags=["Safety"])


class ReportCreate(BaseModel):
    reporter_id: str
    reported_user_id: str
    reason: str = Field(min_length=2, max_length=100)
    details: str = Field(default="", max_length=1000)


class BlockCreate(BaseModel):
    blocker_id: str
    blocked_user_id: str


@router.get("/blocked")
async def get_blocked_users(user_id: str, request: Request):
    db = request.app.state.db
    user_id = str(user_id).strip()

    blocks = await db.blocks.find({"blocker_id": user_id}).to_list(length=500)
    return [str(block["blocked_user_id"]) for block in blocks]


@router.post("/report", status_code=status.HTTP_201_CREATED)
async def report_user(report: ReportCreate, request: Request):
    db = request.app.state.db
    reporter_id = str(report.reporter_id).strip()
    reported_user_id = str(report.reported_user_id).strip()

    if reporter_id == reported_user_id:
        raise HTTPException(status_code=400, detail="You cannot report yourself.")

    reporter = await db.users.find_one({"_id": reporter_id})
    reported_user = await db.users.find_one({"_id": reported_user_id})

    if not reporter or not reported_user:
        raise HTTPException(status_code=404, detail="User not found.")

    report_data = {
        "reporter_id": reporter_id,
        "reported_user_id": reported_user_id,
        "reason": report.reason.strip(),
        "details": report.details.strip(),
        "created_at": datetime.now(timezone.utc),
    }

    result = await db.reports.insert_one(report_data)

    return {
        "message": "Report submitted successfully",
        "id": str(result.inserted_id),
    }


@router.post("/block", status_code=status.HTTP_201_CREATED)
async def block_user(block: BlockCreate, request: Request):
    db = request.app.state.db
    blocker_id = str(block.blocker_id).strip()
    blocked_user_id = str(block.blocked_user_id).strip()

    if blocker_id == blocked_user_id:
        raise HTTPException(status_code=400, detail="You cannot block yourself.")

    blocker = await db.users.find_one({"_id": blocker_id})
    blocked_user = await db.users.find_one({"_id": blocked_user_id})

    if not blocker or not blocked_user:
        raise HTTPException(status_code=404, detail="User not found.")

    existing = await db.blocks.find_one({
        "blocker_id": blocker_id,
        "blocked_user_id": blocked_user_id,
    })

    if not existing:
        await db.blocks.insert_one({
            "blocker_id": blocker_id,
            "blocked_user_id": blocked_user_id,
            "created_at": datetime.now(timezone.utc),
        })

    # End active interaction between the two users.
    await db.connections.delete_many({
        "$or": [
            {"sender_id": blocker_id, "receiver_id": blocked_user_id},
            {"sender_id": blocked_user_id, "receiver_id": blocker_id},
        ]
    })

    await db.messages.delete_many({
        "$or": [
            {"sender_id": blocker_id, "receiver_id": blocked_user_id},
            {"sender_id": blocked_user_id, "receiver_id": blocker_id},
        ]
    })

    return {
        "message": "User blocked successfully",
        "blocked_user_id": blocked_user_id,
    }