from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/activities", tags=["Activities"])


activities_data = [
    {
        "id": 1,
        "name": "Running",
        "category": "Cardio",
        "icon": "🏃",
        "duration": "30-45 min",
        "intensity": "Medium",
        "location": "Outdoor",
        "goal": "Fitness"
    },
    {
        "id": 2,
        "name": "Strength Training",
        "category": "Strength",
        "icon": "🏋️",
        "duration": "45-60 min",
        "intensity": "High",
        "location": "Gym",
        "goal": "Muscle Building"
    },
    {
        "id": 3,
        "name": "Yoga",
        "category": "Wellness",
        "icon": "🧘",
        "duration": "30-60 min",
        "intensity": "Low",
        "location": "Indoor",
        "goal": "Flexibility"
    },
    {
        "id": 4,
        "name": "Cycling",
        "category": "Cardio",
        "icon": "🚴",
        "duration": "30-60 min",
        "intensity": "Medium",
        "location": "Outdoor",
        "goal": "Endurance"
    },
    {
        "id": 5,
        "name": "Swimming",
        "category": "Cardio",
        "icon": "🏊",
        "duration": "30-45 min",
        "intensity": "Medium",
        "location": "Pool",
        "goal": "Fitness"
    },
    {
        "id": 6,
        "name": "Badminton",
        "category": "Sports",
        "icon": "🏸",
        "duration": "45-60 min",
        "intensity": "High",
        "location": "Court",
        "goal": "Fun"
    },
    {
        "id": 7,
        "name": "Walking",
        "category": "Cardio",
        "icon": "🚶",
        "duration": "20-30 min",
        "intensity": "Low",
        "location": "Outdoor",
        "goal": "Wellness"
    },
    {
        "id": 8,
        "name": "Dance Fitness",
        "category": "Fitness",
        "icon": "💃",
        "duration": "30-45 min",
        "intensity": "Medium",
        "location": "Indoor",
        "goal": "Fitness"
    }
]


@router.get("/")
async def get_activities():
    return activities_data


@router.get("/{activity_id}")
async def get_activity(activity_id: int):

    for activity in activities_data:
        if activity["id"] == activity_id:
            return activity

    raise HTTPException(
        status_code=404,
        detail="Activity not found"
    )