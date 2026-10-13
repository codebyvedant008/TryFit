
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/activities", tags=["Activities"])


# Shared sports and activity catalogue for TryFit.
activities_data = [
    {"id": 1, "name": "Running", "category": "Cardio", "icon": "🏃", "duration": "30-45 min", "intensity": "Medium", "location": "Outdoor", "goal": "Fitness"},
    {"id": 2, "name": "Strength Training", "category": "Strength", "icon": "🏋️", "duration": "45-60 min", "intensity": "High", "location": "Gym", "goal": "Muscle Building"},
    {"id": 3, "name": "Yoga", "category": "Wellness", "icon": "🧘", "duration": "30-60 min", "intensity": "Low", "location": "Indoor", "goal": "Flexibility"},
    {"id": 4, "name": "Cycling", "category": "Cardio", "icon": "🚴", "duration": "30-60 min", "intensity": "Medium", "location": "Outdoor", "goal": "Endurance"},
    {"id": 5, "name": "Swimming", "category": "Cardio", "icon": "🏊", "duration": "30-45 min", "intensity": "Medium", "location": "Pool", "goal": "Fitness"},
    {"id": 6, "name": "Badminton", "category": "Sports", "icon": "🏸", "duration": "45-60 min", "intensity": "High", "location": "Court", "goal": "Fun"},
    {"id": 7, "name": "Walking", "category": "Cardio", "icon": "🚶", "duration": "20-30 min", "intensity": "Low", "location": "Outdoor", "goal": "Wellness"},
    {"id": 8, "name": "Dance Fitness", "category": "Fitness", "icon": "💃", "duration": "30-45 min", "intensity": "Medium", "location": "Indoor", "goal": "Fitness"},

    # Racquet and paddle sports
    {"id": 9, "name": "Pickleball", "category": "Racquet Sports", "icon": "🏓", "duration": "30-60 min", "intensity": "Medium", "location": "Court", "goal": "Fun"},
    {"id": 10, "name": "Paddle Ball", "category": "Racquet Sports", "icon": "🏓", "duration": "30-60 min", "intensity": "Medium", "location": "Court", "goal": "Fun"},
    {"id": 11, "name": "Padel", "category": "Racquet Sports", "icon": "🎾", "duration": "45-60 min", "intensity": "Medium", "location": "Court", "goal": "Fitness"},
    {"id": 12, "name": "Tennis", "category": "Racquet Sports", "icon": "🎾", "duration": "45-60 min", "intensity": "High", "location": "Court", "goal": "Fitness"},
    {"id": 13, "name": "Table Tennis", "category": "Racquet Sports", "icon": "🏓", "duration": "30-45 min", "intensity": "Medium", "location": "Indoor", "goal": "Fun"},
    {"id": 14, "name": "Squash", "category": "Racquet Sports", "icon": "🎾", "duration": "30-45 min", "intensity": "High", "location": "Court", "goal": "Fitness"},
    {"id": 15, "name": "Racquetball", "category": "Racquet Sports", "icon": "🎾", "duration": "30-45 min", "intensity": "High", "location": "Court", "goal": "Fitness"},

    # Team sports
    {"id": 16, "name": "Basketball", "category": "Team Sports", "icon": "🏀", "duration": "45-60 min", "intensity": "High", "location": "Court", "goal": "Fitness"},
    {"id": 17, "name": "Football", "category": "Team Sports", "icon": "⚽", "duration": "45-90 min", "intensity": "High", "location": "Outdoor", "goal": "Fun"},
    {"id": 18, "name": "Cricket", "category": "Team Sports", "icon": "🏏", "duration": "60-120 min", "intensity": "Medium", "location": "Ground", "goal": "Fun"},
    {"id": 19, "name": "Volleyball", "category": "Team Sports", "icon": "🏐", "duration": "45-60 min", "intensity": "High", "location": "Court", "goal": "Fitness"},
    {"id": 20, "name": "Hockey", "category": "Team Sports", "icon": "🏑", "duration": "45-60 min", "intensity": "High", "location": "Ground", "goal": "Fitness"},
    {"id": 21, "name": "Rugby", "category": "Team Sports", "icon": "🏉", "duration": "60-80 min", "intensity": "High", "location": "Ground", "goal": "Fitness"},
    {"id": 22, "name": "Baseball", "category": "Team Sports", "icon": "⚾", "duration": "60-120 min", "intensity": "Medium", "location": "Ground", "goal": "Fun"},
    {"id": 23, "name": "American Football", "category": "Team Sports", "icon": "🏈", "duration": "60 min", "intensity": "High", "location": "Ground", "goal": "Fitness"},
    {"id": 24, "name": "Handball", "category": "Team Sports", "icon": "🤾", "duration": "45-60 min", "intensity": "High", "location": "Court", "goal": "Fitness"},
    {"id": 25, "name": "Futsal", "category": "Team Sports", "icon": "⚽", "duration": "30-60 min", "intensity": "High", "location": "Indoor", "goal": "Fun"},

    # Outdoor and adventure
    {"id": 26, "name": "Hiking", "category": "Outdoor", "icon": "🥾", "duration": "60-180 min", "intensity": "Medium", "location": "Trail", "goal": "Wellness"},
    {"id": 27, "name": "Trekking", "category": "Outdoor", "icon": "🏔️", "duration": "2+ hours", "intensity": "High", "location": "Trail", "goal": "Endurance"},
    {"id": 28, "name": "Rock Climbing", "category": "Outdoor", "icon": "🧗", "duration": "45-90 min", "intensity": "High", "location": "Climbing Wall", "goal": "Strength"},
    {"id": 29, "name": "Golf", "category": "Outdoor", "icon": "⛳", "duration": "60-180 min", "intensity": "Low", "location": "Golf Course", "goal": "Fun"},
    {"id": 30, "name": "Skating", "category": "Outdoor", "icon": "⛸️", "duration": "30-60 min", "intensity": "Medium", "location": "Rink", "goal": "Fitness"},
    {"id": 31, "name": "Skateboarding", "category": "Outdoor", "icon": "🛹", "duration": "30-60 min", "intensity": "High", "location": "Skate Park", "goal": "Fun"},
    {"id": 32, "name": "Surfing", "category": "Water Sports", "icon": "🏄", "duration": "45-90 min", "intensity": "High", "location": "Beach", "goal": "Fitness"},
    {"id": 33, "name": "Rowing", "category": "Water Sports", "icon": "🚣", "duration": "30-60 min", "intensity": "High", "location": "Water", "goal": "Endurance"},

    # Fitness and combat sports
    {"id": 34, "name": "CrossFit", "category": "Fitness", "icon": "💪", "duration": "30-60 min", "intensity": "High", "location": "Gym", "goal": "Strength"},
    {"id": 35, "name": "Calisthenics", "category": "Fitness", "icon": "🤸", "duration": "30-60 min", "intensity": "High", "location": "Gym", "goal": "Strength"},
    {"id": 36, "name": "Pilates", "category": "Wellness", "icon": "🧘", "duration": "30-60 min", "intensity": "Medium", "location": "Indoor", "goal": "Flexibility"},
    {"id": 37, "name": "Boxing", "category": "Combat Sports", "icon": "🥊", "duration": "30-60 min", "intensity": "High", "location": "Gym", "goal": "Fitness"},
    {"id": 38, "name": "Kickboxing", "category": "Combat Sports", "icon": "🥊", "duration": "30-60 min", "intensity": "High", "location": "Gym", "goal": "Fitness"},
    {"id": 39, "name": "MMA", "category": "Combat Sports", "icon": "🥋", "duration": "45-60 min", "intensity": "High", "location": "Gym", "goal": "Fitness"},
    {"id": 40, "name": "Martial Arts", "category": "Combat Sports", "icon": "🥋", "duration": "30-60 min", "intensity": "High", "location": "Indoor", "goal": "Fitness"},
    {"id": 41, "name": "Zumba", "category": "Fitness", "icon": "💃", "duration": "30-60 min", "intensity": "Medium", "location": "Indoor", "goal": "Fitness"},
    {"id": 42, "name": "Athletics", "category": "Sports", "icon": "🏅", "duration": "30-60 min", "intensity": "High", "location": "Track", "goal": "Endurance"},
    {"id": 43, "name": "Jump Rope", "category": "Cardio", "icon": "🪢", "duration": "15-30 min", "intensity": "High", "location": "Indoor", "goal": "Fitness"},
]


@router.get("/")
async def get_activities():
    return activities_data


@router.get("/{activity_id}")
async def get_activity(activity_id: int):
    for activity in activities_data:
        if activity["id"] == activity_id:
            return activity

    raise HTTPException(status_code=404, detail="Activity not found")
