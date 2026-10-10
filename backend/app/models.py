from typing import Optional

from pydantic import BaseModel, EmailStr, Field, ConfigDict


# ============================================================
# USER CREATE
# ============================================================

class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=60)
    email: EmailStr
    age: int = Field(ge=16, le=100)

    # Personal
    gender: str = ""
    city: str = Field(min_length=2, max_length=80)
    height_cm: Optional[int] = Field(default=None, ge=100, le=250)
    profession: str = ""
    education: str = ""
    hometown: str = ""
    languages: list[str] = Field(default_factory=list)

    # Contact
    phone_number: str = ""
    phone_verified: bool = False

    # Media
    profile_photo: str = ""
    additional_photos: list[str] = Field(default_factory=list)
    fitness_video_url: str = ""

    # Fitness
    sports: list[str] = Field(default_factory=list)
    goals: list[str] = Field(default_factory=list)
    activity: str = ""
    activity_preferences: list[str] = Field(default_factory=list)

    level: str = "Beginner"
    workout_frequency: str = ""
    training_intensity: str = ""

    # Availability
    preferred_days: list[str] = Field(default_factory=list)
    preferred_times: list[str] = Field(default_factory=list)
    availability: str = "Flexible"

    # Matching
    personality: list[str] = Field(default_factory=list)
    looking_for: list[str] = Field(default_factory=list)

    # Partner preferences
    preferred_age_min: int = Field(default=18, ge=16, le=100)
    preferred_age_max: int = Field(default=60, ge=16, le=100)
    preferred_distance_km: int = Field(default=25, ge=1, le=200)

    # Profile
    bio: str = ""

    # Prompts
    prompts: list[dict] = Field(default_factory=list)


# ============================================================
# USER UPDATE
# ============================================================

class UserUpdate(BaseModel):
    """
    Used when editing an existing profile.

    Email is intentionally NOT included here.
    Email cannot be changed through profile editing.
    """

    name: str = Field(min_length=2, max_length=60)
    age: int = Field(ge=16, le=100)

    # Personal
    gender: str = ""
    city: str = Field(min_length=2, max_length=80)
    height_cm: Optional[int] = Field(default=None, ge=100, le=250)
    profession: str = ""
    education: str = ""
    hometown: str = ""
    languages: list[str] = Field(default_factory=list)

    # Contact
    phone_number: str = ""
    phone_verified: bool = False

    # Media
    profile_photo: str = ""
    additional_photos: list[str] = Field(default_factory=list)
    fitness_video_url: str = ""

    # Fitness
    sports: list[str] = Field(default_factory=list)
    goals: list[str] = Field(default_factory=list)
    activity: str = ""
    activity_preferences: list[str] = Field(default_factory=list)

    level: str = "Beginner"
    workout_frequency: str = ""
    training_intensity: str = ""

    # Availability
    preferred_days: list[str] = Field(default_factory=list)
    preferred_times: list[str] = Field(default_factory=list)
    availability: str = "Flexible"

    # Matching
    personality: list[str] = Field(default_factory=list)
    looking_for: list[str] = Field(default_factory=list)

    # Partner preferences
    preferred_age_min: int = Field(default=18, ge=16, le=100)
    preferred_age_max: int = Field(default=60, ge=16, le=100)
    preferred_distance_km: int = Field(default=25, ge=1, le=200)

    # Profile
    bio: str = ""

    # Prompts
    prompts: list[dict] = Field(default_factory=list)


# ============================================================
# USER RESPONSE
# ============================================================

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    name: str
    email: EmailStr
    age: int

    # Personal
    gender: str = ""
    city: str = ""
    height_cm: Optional[int] = None
    profession: str = ""
    education: str = ""
    hometown: str = ""
    languages: list[str] = Field(default_factory=list)

    # Contact
    phone_number: str = ""
    phone_verified: bool = False

    # Media
    profile_photo: str = ""
    additional_photos: list[str] = Field(default_factory=list)
    fitness_video_url: str = ""

    # Fitness
    sports: list[str] = Field(default_factory=list)
    goals: list[str] = Field(default_factory=list)
    activity: str = ""
    activity_preferences: list[str] = Field(default_factory=list)

    level: str = "Beginner"
    workout_frequency: str = ""
    training_intensity: str = ""

    # Availability
    preferred_days: list[str] = Field(default_factory=list)
    preferred_times: list[str] = Field(default_factory=list)
    availability: str = "Flexible"

    # Matching
    personality: list[str] = Field(default_factory=list)
    looking_for: list[str] = Field(default_factory=list)

    # Partner preferences
    preferred_age_min: int = 18
    preferred_age_max: int = 60
    preferred_distance_km: int = 25

    # Profile
    bio: str = ""

    # Prompts
    prompts: list[dict] = Field(default_factory=list)


# ============================================================
# GAME
# ============================================================

class GameCreate(BaseModel):
    title: str = Field(min_length=3, max_length=100)
    activity: str
    location: str
    date: str
    time: str
    total: int = Field(ge=2, le=50)
    host: str = "TryFit User"


# ============================================================
# CONNECTION
# ============================================================

class ConnectionCreate(BaseModel):
    sender_id: str
    receiver_id: str