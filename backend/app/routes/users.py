from uuid import uuid4

from fastapi import APIRouter, Request, HTTPException, status
from pymongo.errors import DuplicateKeyError

from app.models import UserCreate, UserUpdate


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


# ============================================================
# SERIALIZE USER
# ============================================================

def serialize_user(user):
    """
    Convert MongoDB user document into a frontend-friendly object.
    """

    return {
        "id": str(user["_id"]),

        # Basic
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "age": user.get("age", 18),

        # Personal
        "gender": user.get("gender", ""),
        "city": user.get("city", ""),
        "height_cm": user.get("height_cm"),
        "profession": user.get("profession", ""),
        "education": user.get("education", ""),
        "hometown": user.get("hometown", ""),
        "languages": user.get("languages", []),

        # Contact
        "phone_number": user.get("phone_number", ""),
        "phone_verified": user.get("phone_verified", False),

        # Media
        "profile_photo": user.get("profile_photo", ""),
        "additional_photos": user.get("additional_photos", []),
        "fitness_video_url": user.get("fitness_video_url", ""),

        # Fitness
        "sports": user.get("sports", []),
        "goals": user.get("goals", []),
        "activity": user.get("activity", ""),
        "activity_preferences": user.get(
            "activity_preferences",
            []
        ),

        "level": user.get(
            "level",
            "Beginner"
        ),

        "workout_frequency": user.get(
            "workout_frequency",
            ""
        ),

        "training_intensity": user.get(
            "training_intensity",
            ""
        ),

        # Availability
        "preferred_days": user.get(
            "preferred_days",
            []
        ),

        "preferred_times": user.get(
            "preferred_times",
            []
        ),

        "availability": user.get(
            "availability",
            "Flexible"
        ),

        # Matching
        "personality": user.get(
            "personality",
            []
        ),

        "looking_for": user.get(
            "looking_for",
            []
        ),

        # Partner preferences
        "preferred_age_min": user.get(
            "preferred_age_min",
            18
        ),

        "preferred_age_max": user.get(
            "preferred_age_max",
            60
        ),

        "preferred_distance_km": user.get(
            "preferred_distance_km",
            25
        ),

        # Profile
        "bio": user.get(
            "bio",
            ""
        ),

        "prompts": user.get(
            "prompts",
            []
        ),

        # Google
        "google_picture": user.get(
            "google_picture",
            ""
        ),
    }


# ============================================================
# CREATE USER
# ============================================================

@router.post(
    "/",
    status_code=status.HTTP_201_CREATED
)
async def create_user(
    user: UserCreate,
    request: Request
):
    db = request.app.state.db

    user_data = user.model_dump()

    # Normalize email
    user_data["email"] = str(
        user_data["email"]
    ).lower()

    # Generate user ID
    user_data["_id"] = str(uuid4())

    try:
        await db.users.insert_one(
            user_data
        )

    except DuplicateKeyError:
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists.",
        )

    return {
        "message": "User created successfully",
        "user": serialize_user(user_data),
    }


# ============================================================
# GET ALL USERS
# ============================================================

@router.get("/")
async def get_users(
    request: Request
):
    db = request.app.state.db

    users = await db.users.find().to_list(
        length=100
    )

    return [
        serialize_user(user)
        for user in users
    ]


# ============================================================
# GET SINGLE USER
# ============================================================

@router.get("/{user_id}")
async def get_user(
    user_id: str,
    request: Request,
):
    db = request.app.state.db

    user = await db.users.find_one(
        {
            "_id": user_id
        }
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    return serialize_user(user)


# ============================================================
# UPDATE USER PROFILE
# ============================================================

@router.put("/{user_id}")
async def update_user(
    user_id: str,
    user: UserUpdate,
    request: Request,
):
    db = request.app.state.db

    # --------------------------------------------------------
    # Find existing user
    # --------------------------------------------------------

    existing_user = await db.users.find_one(
        {
            "_id": user_id
        }
    )

    if not existing_user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    # --------------------------------------------------------
    # Prepare update
    # --------------------------------------------------------

    update_data = user.model_dump()

    # Email is intentionally NOT part of UserUpdate,
    # but this extra protection makes sure it can never
    # accidentally be changed.
    update_data.pop(
        "email",
        None
    )

    # --------------------------------------------------------
    # Preserve phone verification status
    #
    # OTP verification should be handled by a dedicated
    # verification endpoint later.
    # --------------------------------------------------------

    if (
        "phone_number" in update_data
        and update_data["phone_number"]
        != existing_user.get("phone_number", "")
    ):
        update_data["phone_verified"] = False

    # --------------------------------------------------------
    # Update MongoDB
    # --------------------------------------------------------

    await db.users.update_one(
        {
            "_id": user_id
        },
        {
            "$set": update_data
        }
    )

    # --------------------------------------------------------
    # Fetch updated user
    # --------------------------------------------------------

    updated_user = await db.users.find_one(
        {
            "_id": user_id
        }
    )

    return {
        "message": "Profile updated successfully",
        "user": serialize_user(
            updated_user
        ),
    }