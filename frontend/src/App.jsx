import { useEffect, useMemo, useState } from "react";



import { api } from "./api";



import "./App.css";







const activities = [



  { id: 1, name: "Running", category: "Cardio", icon: "🏃", duration: "15–30 min", intensity: "Medium", location: "Outdoor", goal: "Fitness", description: "Build stamina and explore your surroundings." },



  { id: 2, name: "Strength Training", category: "Strength", icon: "🏋️", duration: "30–60 min", intensity: "High", location: "Gym", goal: "Muscle building", description: "Build strength with a structured workout." },



  { id: 3, name: "Yoga", category: "Mind & Body", icon: "🧘", duration: "15–30 min", intensity: "Low", location: "Indoor", goal: "Flexibility", description: "Improve mobility, balance, and mindfulness." },



  { id: 4, name: "Cycling", category: "Cardio", icon: "🚴", duration: "30–60 min", intensity: "Medium", location: "Outdoor", goal: "Fitness", description: "Get moving with a refreshing cycling session." },



  { id: 5, name: "Swimming", category: "Sports", icon: "🏊", duration: "30–60 min", intensity: "Medium", location: "Indoor", goal: "Fitness", description: "A full-body workout in the water." },



  { id: 6, name: "Badminton", category: "Sports", icon: "🏸", duration: "30–60 min", intensity: "High", location: "Indoor", goal: "Social", description: "Play, compete, and meet new people." },



  { id: 7, name: "Walking", category: "Cardio", icon: "🚶", duration: "15–30 min", intensity: "Low", location: "Outdoor", goal: "Weight management", description: "A simple way to stay active every day." },



  { id: 8, name: "Dance Fitness", category: "Mind & Body", icon: "💃", duration: "30–60 min", intensity: "Medium", location: "Indoor", goal: "Social", description: "Move to the beat and enjoy a fun workout." },



];







const iconFor = (name) =>



  activities.find((activity) => activity.name === name)?.icon || "🏅";







const avatarColors = [



  "avatar-green",



  "avatar-purple",



  "avatar-orange",



  "avatar-pink",



];







const MATCH_WEIGHTS = {
  sports: 25,
  goals: 20,
  availability: 15,
  level: 10,
  frequency: 10,
  lookingFor: 10,
  personality: 10,
};

const LEVEL_RANK = { Beginner: 1, Intermediate: 2, Advanced: 3, Competitive: 4 };

const FREQUENCY_RANK = {
  "Once a week": 1,
  "1–2 times a week": 1,
  "2–3 times a week": 2,
  "3–4 times a week": 3,
  "4–5 times a week": 4,
  "5+ times a week": 5,
};

const normalizeList = (value) => Array.isArray(value) ? value.map((item) => String(item).trim().toLowerCase()).filter(Boolean) : [];

const overlapRatio = (first, second) => {
  const a = normalizeList(first);
  const b = normalizeList(second);
  if (!a.length || !b.length) return 0;
  const bSet = new Set(b);
  const matches = a.filter((item) => bSet.has(item)).length;
  const union = new Set([...a, ...b]).size;
  return union ? matches / union : 0;
};

const calculateFrequencyScore = (first, second) => {
  if (!first || !second) return 0;
  const a = FREQUENCY_RANK[first] ?? FREQUENCY_RANK[String(first).trim()];
  const b = FREQUENCY_RANK[second] ?? FREQUENCY_RANK[String(second).trim()];
  if (!a || !b) return first === second ? 1 : 0;
  const difference = Math.abs(a - b);
  return difference === 0 ? 1 : difference === 1 ? 0.65 : difference === 2 ? 0.3 : 0;
};

const calculateCompatibility = (currentUser, partner) => {
  if (!currentUser || !partner) return { score: 0, breakdown: {}, reasons: [] };

  // The score follows the TryFit product specification exactly:
  // Sports 25% + Goals 20% + Workout times/days 15% + Level 10%
  // + Frequency 10% + Looking for 10% + Personality 10% = 100%.
  const sportsScore = overlapRatio(currentUser.sports, partner.sports);
  const goalsScore = overlapRatio(currentUser.goals, partner.goals);

  const currentTimes = currentUser.preferred_times?.length
    ? currentUser.preferred_times
    : currentUser.availability
      ? [currentUser.availability]
      : [];
  const partnerTimes = partner.preferred_times?.length
    ? partner.preferred_times
    : partner.availability
      ? [partner.availability]
      : [];

  const timeScore = overlapRatio(currentTimes, partnerTimes);
  const dayScore = overlapRatio(currentUser.preferred_days, partner.preferred_days);
  const availabilityScore = currentUser.preferred_days?.length && partner.preferred_days?.length
    ? (timeScore + dayScore) / 2
    : timeScore;

  const currentLevel = LEVEL_RANK[currentUser.level] || 0;
  const partnerLevel = LEVEL_RANK[partner.level] || 0;
  let levelScore = 0;
  if (currentLevel && partnerLevel) {
    const difference = Math.abs(currentLevel - partnerLevel);
    levelScore = difference === 0 ? 1 : difference === 1 ? 0.7 : difference === 2 ? 0.4 : 0.15;
  }

  const frequencyScore = calculateFrequencyScore(
    currentUser.workout_frequency,
    partner.workout_frequency
  );
  const lookingForScore = overlapRatio(currentUser.looking_for, partner.looking_for);
  const personalityScore = overlapRatio(currentUser.personality, partner.personality);

  const breakdown = {
    sports: Math.round(sportsScore * MATCH_WEIGHTS.sports),
    goals: Math.round(goalsScore * MATCH_WEIGHTS.goals),
    availability: Math.round(availabilityScore * MATCH_WEIGHTS.availability),
    level: Math.round(levelScore * MATCH_WEIGHTS.level),
    frequency: Math.round(frequencyScore * MATCH_WEIGHTS.frequency),
    lookingFor: Math.round(lookingForScore * MATCH_WEIGHTS.lookingFor),
    personality: Math.round(personalityScore * MATCH_WEIGHTS.personality),
  };

  const score = Math.min(100, Object.values(breakdown).reduce((total, value) => total + value, 0));
  const reasons = [];

  const commonSports = normalizeList(currentUser.sports).filter((sport) => normalizeList(partner.sports).includes(sport));
  if (commonSports.length) reasons.push(`Both play ${commonSports.slice(0, 2).join(", ")}`);

  const commonGoals = normalizeList(currentUser.goals).filter((goal) => normalizeList(partner.goals).includes(goal));
  if (commonGoals.length) reasons.push(`Shared goal: ${commonGoals[0]}`);

  const commonTimes = normalizeList(currentTimes).filter((time) => normalizeList(partnerTimes).includes(time));
  if (commonTimes.length) reasons.push(`Both prefer ${commonTimes[0]} workouts`);

  const commonDays = normalizeList(currentUser.preferred_days).filter((day) => normalizeList(partner.preferred_days).includes(day));
  if (commonDays.length) reasons.push(`Both are free on ${commonDays.slice(0, 2).join(" and ")}`);

  if (currentLevel && partnerLevel) {
    const difference = Math.abs(currentLevel - partnerLevel);
    if (difference === 0) reasons.push(`Same fitness level: ${currentUser.level}`);
    else if (difference === 1) reasons.push("Similar fitness level");
  }

  if (frequencyScore >= 0.65) reasons.push("Similar training frequency");

  const commonLookingFor = normalizeList(currentUser.looking_for).filter((item) => normalizeList(partner.looking_for).includes(item));
  if (commonLookingFor.length) reasons.push(`Both want a ${commonLookingFor[0].toLowerCase()}`);

  const commonPersonality = normalizeList(currentUser.personality).filter((item) => normalizeList(partner.personality).includes(item));
  if (commonPersonality.length) reasons.push(`Similar vibe: ${commonPersonality[0]}`);

  if (!reasons.length && currentUser.city && partner.city && currentUser.city === partner.city) {
    reasons.push(`Both are in ${partner.city}`);
  }

  return {
    score,
    breakdown,
    reasons: reasons.slice(0, 4),
  };
};

const DEFAULT_PROFILE_PROMPTS = [
  { question: "My current fitness goal is...", answer: "" },
  { question: "The sport I could play all day is...", answer: "" },
  { question: "My ideal workout partner is...", answer: "" },
  { question: "Convince me to try your favourite sport.", answer: "" },
  { question: "One activity I want to try...", answer: "" },
];

const createProfileForm = (user = {}) => ({
  name: user.name || "",
  age: user.age ?? "",
  gender: user.gender || "",
  city: user.city || "",
  height_cm: user.height_cm ?? "",
  profession: user.profession || "",
  education: user.education || "",
  hometown: user.hometown || "",
  languages: Array.isArray(user.languages) ? user.languages : [],
  phone_number: user.phone_number || "",
  phone_verified: Boolean(user.phone_verified),
  profile_photo: user.profile_photo || "",
  additional_photos: Array.isArray(user.additional_photos) ? user.additional_photos : [],
  fitness_video_url: user.fitness_video_url || "",
  sports: Array.isArray(user.sports) ? user.sports : [],
  goals: Array.isArray(user.goals) ? user.goals : [],
  activity: user.activity || "",
  activity_preferences: Array.isArray(user.activity_preferences) ? user.activity_preferences : [],
  level: user.level || "Beginner",
  workout_frequency: user.workout_frequency || "",
  training_intensity: user.training_intensity || "",
  preferred_days: Array.isArray(user.preferred_days) ? user.preferred_days : [],
  preferred_times: Array.isArray(user.preferred_times) ? user.preferred_times : [],
  availability: user.availability || "Flexible",
  personality: Array.isArray(user.personality) ? user.personality : [],
  looking_for: Array.isArray(user.looking_for) ? user.looking_for : [],
  preferred_age_min: user.preferred_age_min ?? 18,
  preferred_age_max: user.preferred_age_max ?? 60,
  preferred_distance_km: user.preferred_distance_km ?? 25,
  bio: user.bio || "",
  prompts: Array.isArray(user.prompts) && user.prompts.length
    ? user.prompts.map((prompt) => ({ question: prompt?.question || "", answer: prompt?.answer || "" }))
    : DEFAULT_PROFILE_PROMPTS.map((prompt) => ({ ...prompt })),
});

const toggleProfileListValue = (list, value) => {
  const current = Array.isArray(list) ? list : [];
  return current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];
};

function App() {



  const [activityList, setActivityList] = useState(activities);



  const [apiStatus, setApiStatus] = useState("Connecting...");







  const [users, setUsers] = useState([]);



  const [currentUserId, setCurrentUserId] = useState("");



  const [usersLoading, setUsersLoading] = useState(true);







  const [selectedCategory, setSelectedCategory] = useState("All");



  const [goal, setGoal] = useState("Fitness");



  const [duration, setDuration] = useState("Any");



  const [intensity, setIntensity] = useState("Any");



  const [location, setLocation] = useState("Any");



  const [search, setSearch] = useState("");



  const [activeActivity, setActiveActivity] = useState("All");







  const [connections, setConnections] = useState([]);



  const [games, setGames] = useState([]);



  const [joinedGames, setJoinedGames] = useState([]);



  const [notice, setNotice] = useState("");



  const [busyGame, setBusyGame] = useState(null);



  const [busyPartner, setBusyPartner] = useState(null);

  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatText, setChatText] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [blockedUserIds, setBlockedUserIds] = useState([]);
  const [passedUserIds, setPassedUserIds] = useState([]);
  const [profileViewUser, setProfileViewUser] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("Spam or fake profile");
  const [reportDetails, setReportDetails] = useState("");
  const [safetyBusy, setSafetyBusy] = useState(false);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileForm, setProfileForm] = useState(createProfileForm());







  const [showGameForm, setShowGameForm] = useState(false);



  const [gameTitle, setGameTitle] = useState("");



  const [gameActivity, setGameActivity] = useState("Running");



  const [gameLocation, setGameLocation] = useState("");



  const [gameDate, setGameDate] = useState("");



  const [gameTime, setGameTime] = useState("");



  const [gameCapacity, setGameCapacity] = useState("4");

  // Google authentication
  const [googleReady, setGoogleReady] = useState(false);
  const [googleSigningIn, setGoogleSigningIn] = useState(false);
  const [showGoogleLogin, setShowGoogleLogin] = useState(false);
  const [googleUser, setGoogleUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("tryfit_google_user") || "null");
    } catch {
      return null;
    }
  });







  const handleGoogleCredential = async (response) => {
    if (!response?.credential) {
      setNotice("Google sign-in did not return a credential.");
      return;
    }

    setGoogleSigningIn(true);
    try {
      const result = await api.googleLogin(response.credential);
      const loggedInUser = result?.user;

      if (!loggedInUser?.id) {
        throw new Error("Google login did not return a user account.");
      }

      const normalizedUser = { ...loggedInUser, id: String(loggedInUser.id) };

      setUsers((previous) => {
        const exists = previous.some((user) => String(user.id) === normalizedUser.id);
        if (exists) {
          return previous.map((user) =>
            String(user.id) === normalizedUser.id ? { ...user, ...normalizedUser } : user
          );
        }
        return [...previous, normalizedUser];
      });

      setCurrentUserId(normalizedUser.id);
      setGoogleUser(normalizedUser);
      localStorage.setItem("tryfit_google_user", JSON.stringify(normalizedUser));
      setShowGoogleLogin(false);
      setNotice(`Welcome to TryFit, ${normalizedUser.name}! 💚`);
    } catch (error) {
      console.error("Google sign-in failed:", error);
      setNotice(error.message || "Google sign-in failed. Please try again.");
    } finally {
      setGoogleSigningIn(false);
    }
  };

  const handleGoogleLogout = () => {
    setGoogleUser(null);
    localStorage.removeItem("tryfit_google_user");
    setShowGoogleLogin(false);
    setNotice("Signed out of Google.");
  };

  const openAuthOrScroll = (sectionId = "discover") => {
    if (!googleUser) {
      setShowGoogleLogin(true);
      return;
    }
    scrollTo(sectionId);
  };

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error("VITE_GOOGLE_CLIENT_ID is missing from the frontend .env file.");
      return undefined;
    }

    let checkInterval;
    const initializeGoogle = () => {
      if (!window.google?.accounts?.id) return false;
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCredential,
        });
        setGoogleReady(true);
        if (checkInterval) clearInterval(checkInterval);
        return true;
      } catch (error) {
        console.error("Google initialization failed:", error);
        return false;
      }
    };

    if (initializeGoogle()) return undefined;

    let script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    const handleScriptLoad = () => initializeGoogle();

    if (!script) {
      script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.addEventListener("load", handleScriptLoad);
      document.head.appendChild(script);
    } else {
      script.addEventListener("load", handleScriptLoad);
    }

    checkInterval = setInterval(initializeGoogle, 200);

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      script?.removeEventListener("load", handleScriptLoad);
    };
  }, []);

  useEffect(() => {
    if (!showGoogleLogin || !googleReady || !window.google?.accounts?.id) return;
    const buttonContainer = document.getElementById("google-signin-button");
    if (!buttonContainer) return;
    buttonContainer.innerHTML = "";
    window.google.accounts.id.renderButton(buttonContainer, {
      theme: "filled_black",
      size: "large",
      width: 320,
      text: "continue_with",
      shape: "rectangular",
    });
  }, [showGoogleLogin, googleReady]);

  const currentUser = users.find(
    (user) => String(user.id) === String(currentUserId)
  );

  useEffect(() => {
    if (!googleUser?.id || !users.length) return;
    const googleId = String(googleUser.id);
    if (users.some((user) => String(user.id) === googleId)) {
      setCurrentUserId(googleId);
    }
  }, [googleUser, users]);

  useEffect(() => {
    if (!currentUser) return;
    setProfileForm(createProfileForm(currentUser));
  }, [currentUser]);

  const handleProfileChange = (field, value) => {
    setProfileForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    if (!currentUserId) {
      setNotice("Please select an account first.");
      return;
    }

    if (!profileForm.name.trim() || !profileForm.city.trim()) {
      setNotice("Name and city are required.");
      return;
    }

    const age = profileForm.age === "" ? 18 : Number(profileForm.age);
    const height = profileForm.height_cm === "" ? null : Number(profileForm.height_cm);
    const preferredAgeMin = Number(profileForm.preferred_age_min);
    const preferredAgeMax = Number(profileForm.preferred_age_max);
    const preferredDistance = Number(profileForm.preferred_distance_km);

    if (!Number.isFinite(age) || age < 16 || age > 100) {
      setNotice("Age must be between 16 and 100.");
      return;
    }

    if (height !== null && (!Number.isFinite(height) || height < 100 || height > 250)) {
      setNotice("Height must be between 100 cm and 250 cm.");
      return;
    }

    if (preferredAgeMin < 16 || preferredAgeMax > 100 || preferredAgeMin > preferredAgeMax) {
      setNotice("Please enter a valid preferred age range.");
      return;
    }

    if (preferredDistance < 1 || preferredDistance > 200) {
      setNotice("Preferred distance must be between 1 and 200 km.");
      return;
    }

    setProfileSaving(true);

    try {
      const payload = {
        name: profileForm.name.trim(),
        age,
        gender: profileForm.gender.trim(),
        city: profileForm.city.trim(),
        height_cm: height,
        profession: profileForm.profession.trim(),
        education: profileForm.education.trim(),
        hometown: profileForm.hometown.trim(),
        languages: profileForm.languages.filter(Boolean),
        phone_number: profileForm.phone_number.trim(),
        phone_verified: profileForm.phone_verified,
        profile_photo: profileForm.profile_photo.trim(),
        additional_photos: profileForm.additional_photos.filter(Boolean),
        fitness_video_url: profileForm.fitness_video_url.trim(),
        sports: profileForm.sports,
        goals: profileForm.goals,
        activity: profileForm.activity,
        activity_preferences: profileForm.activity_preferences,
        level: profileForm.level,
        workout_frequency: profileForm.workout_frequency,
        training_intensity: profileForm.training_intensity,
        preferred_days: profileForm.preferred_days,
        preferred_times: profileForm.preferred_times,
        availability: profileForm.availability,
        personality: profileForm.personality,
        looking_for: profileForm.looking_for,
        preferred_age_min: preferredAgeMin,
        preferred_age_max: preferredAgeMax,
        preferred_distance_km: preferredDistance,
        bio: profileForm.bio.trim(),
        prompts: profileForm.prompts
          .map((prompt) => ({
            question: String(prompt?.question || "").trim(),
            answer: String(prompt?.answer || "").trim(),
          }))
          .filter((prompt) => prompt.question),
      };

      const result = await api.updateUser(currentUserId, payload);
      const updatedUser = result?.user;

      if (!updatedUser) {
        throw new Error("The backend did not return the updated profile.");
      }

      const normalizedUser = {
        ...updatedUser,
        id: String(updatedUser.id ?? updatedUser._id ?? currentUserId),
      };

      setUsers((previous) =>
        previous.map((user) =>
          String(user.id) === String(currentUserId) ? normalizedUser : user
        )
      );

      if (googleUser?.id && String(googleUser.id) === String(currentUserId)) {
        const updatedGoogleUser = { ...googleUser, ...normalizedUser };
        setGoogleUser(updatedGoogleUser);
        localStorage.setItem("tryfit_google_user", JSON.stringify(updatedGoogleUser));
      }

      setProfileForm(createProfileForm(normalizedUser));
      setIsEditingProfile(false);
      setNotice("Profile updated successfully! 💚");
    } catch (error) {
      console.error("Profile update failed:", error);
      setNotice(error.message || "Could not update your profile.");
    } finally {
      setProfileSaving(false);
    }
  };




  const loadPassedUsers = (userId) => {
    if (!userId) {
      setPassedUserIds([]);
      return;
    }
    const storageKey = `tryfit_passed_users_${String(userId)}`;
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || "[]");
      setPassedUserIds(Array.isArray(stored) ? stored.map((id) => String(id)) : []);
    } catch (error) {
      console.error("Passed users loading failed:", error);
      setPassedUserIds([]);
    }
  };

  useEffect(() => {
    loadPassedUsers(currentUserId);
  }, [currentUserId]);

  const handlePassUser = (partner) => {
    if (!currentUserId || !partner?.id) return;
    const passedId = String(partner.id);
    setPassedUserIds((previous) => {
      const updated = [...new Set([...previous, passedId])];
      try {
        localStorage.setItem(`tryfit_passed_users_${String(currentUserId)}`, JSON.stringify(updated));
      } catch (error) {
        console.error("Passed users save failed:", error);
      }
      return updated;
    });
    setNotice(`${partner.name || "Profile"} passed. We will keep them out of your Discover list.`);
  };


  const partners = useMemo(() => {



    return users



      .filter((user) => String(user.id) !== String(currentUserId))



      .filter((user) => !blockedUserIds.includes(String(user.id)))
      .filter((user) => !passedUserIds.includes(String(user.id)))
.map((user, index) => ({



        ...user,



        id: String(user.id),



        avatar: user.name?.trim()?.charAt(0)?.toUpperCase() || "?",



        color: avatarColors[index % avatarColors.length],



      }));



  }, [users, currentUserId, blockedUserIds, passedUserIds]);







  const loadGames = async () => {



    const data = await api.getGames();







    if (!Array.isArray(data)) {



      throw new Error("Invalid games response from backend");



    }







    setGames(



      data.map((game) => ({



        ...game,



        id: String(game.id ?? game._id),



        players: Number(game.players ?? 0),



        total: Number(game.total ?? 0),



        icon: iconFor(game.activity),



      }))



    );



  };







  const loadConnections = async () => {



    const data = await api.getConnections();







    if (!Array.isArray(data)) {



      throw new Error("Invalid connections response from backend");



    }







    setConnections(data);



  };







  useEffect(() => {



    let active = true;







    const loadData = async () => {



      const results = await Promise.allSettled([



        api.getActivities(),



        api.getGames(),



        api.getUsers(),



        api.getConnections(),



      ]);







      if (!active) return;







      const [activityResult, gameResult, userResult, connectionResult] =



        results;







      if (activityResult.status === "fulfilled") {



        const activityData = activityResult.value;







        if (Array.isArray(activityData)) {



          setActivityList(



            activityData.map((item) => ({



              ...activities.find((a) => a.name === item.name),



              ...item,



              icon: item.icon || iconFor(item.name),



              description:



                item.description ||



                activities.find((a) => a.name === item.name)?.description ||



                "Explore this activity and find your fitness community.",



            }))



          );



        }



      } else {



        console.error("Activities loading error:", activityResult.reason);



      }







      if (gameResult.status === "fulfilled") {



        const gameData = gameResult.value;







        if (Array.isArray(gameData)) {



          setGames(



            gameData.map((game) => ({



              ...game,



              id: String(game.id ?? game._id),



              players: Number(game.players ?? 0),



              total: Number(game.total ?? 0),



              icon: iconFor(game.activity),



            }))



          );



        }



      } else {



        console.error("Games loading error:", gameResult.reason);



      }







      if (userResult.status === "fulfilled") {



        const userData = userResult.value;







        if (Array.isArray(userData)) {



          const normalizedUsers = userData.map((user) => ({



            ...user,



            id: String(user.id ?? user._id),



          }));







          setUsers(normalizedUsers);







          setCurrentUserId((previous) => {



            if (



              previous &&



              normalizedUsers.some((user) => user.id === previous)



            ) {



              return previous;



            }







            return normalizedUsers[0]?.id || "";



          });



        }



      } else {



        console.error("Users loading error:", userResult.reason);



        setNotice("Could not load registered users.");



      }







      if (connectionResult.status === "fulfilled") {



        if (Array.isArray(connectionResult.value)) {



          setConnections(connectionResult.value);



        }



      } else {



        console.error(



          "Connections loading error:",



          connectionResult.reason



        );



      }







      const coreApiWorking =



        activityResult.status === "fulfilled" &&



        gameResult.status === "fulfilled";







      setApiStatus(



        coreApiWorking



          ? "Connected to backend"



          : "Some backend features are unavailable"



      );







      setUsersLoading(false);



    };







    loadData();







    return () => {



      active = false;



    };



  }, []);







  const categories = ["All", "Cardio", "Strength", "Mind & Body", "Sports"];







  const filteredActivities = useMemo(() => {



    return activityList.filter((activity) => {



      const categoryMatch =



        selectedCategory === "All" || activity.category === selectedCategory;







      const durationMatch =



        duration === "Any" || activity.duration === duration;







      const intensityMatch =



        intensity === "Any" || activity.intensity === intensity;







      const locationMatch =



        location === "Any" || activity.location === location;







      const searchMatch =



        activity.name.toLowerCase().includes(search.toLowerCase()) ||



        activity.category.toLowerCase().includes(search.toLowerCase());







      return (



        categoryMatch &&



        durationMatch &&



        intensityMatch &&



        locationMatch &&



        searchMatch



      );



    });



  }, [



    activityList,



    selectedCategory,



    duration,



    intensity,



    location,



    search,



  ]);







  const recommendedActivities = useMemo(() => {



    const matches = activityList.filter((activity) => {



      if (goal === "Fitness") {



        return [



          "Running",



          "Cycling",



          "Swimming",



          "Strength Training",



        ].includes(activity.name);



      }







      if (goal === "Muscle building") {



        return activity.name === "Strength Training";



      }







      if (goal === "Flexibility") {



        return activity.name === "Yoga";



      }







      if (goal === "Social") {



        return ["Badminton", "Dance Fitness", "Running"].includes(



          activity.name



        );



      }







      if (goal === "Weight management") {



        return ["Walking", "Running", "Cycling", "Swimming"].includes(



          activity.name



        );



      }







      return true;



    });







    return matches.slice(0, 3);



  }, [activityList, goal]);







  const filteredPartners = useMemo(() => {



    return partners
      .filter((partner) => !blockedUserIds.includes(String(partner.id)))
      .filter((partner) => {



      const activityMatch =



        activeActivity === "All" || partner.activity === activeActivity;







      const searchMatch =



        (partner.name || "").toLowerCase().includes(search.toLowerCase()) ||



        (partner.activity || "").toLowerCase().includes(search.toLowerCase());







      return activityMatch && searchMatch;



      })
      .map((partner) => ({
        ...partner,
        match: calculateCompatibility(currentUser, partner),
      }))
      .sort((a, b) => b.match.score - a.match.score);



  }, [partners, activeActivity, search, currentUser, blockedUserIds]);







  const partnerActivities = [



    "All",



    ...new Set(partners.map((partner) => partner.activity).filter(Boolean)),



  ];







  const getConnection = (partnerId) => {



    return connections.find((connection) => {



      const sentByCurrentUser =



        String(connection.sender_id) === String(currentUserId) &&



        String(connection.receiver_id) === String(partnerId);







      const receivedByCurrentUser =



        String(connection.receiver_id) === String(currentUserId) &&



        String(connection.sender_id) === String(partnerId);







      return sentByCurrentUser || receivedByCurrentUser;



    });



  };







  const loadBlockedUsers = async (userId) => {
    if (!userId) {
      setBlockedUserIds([]);
      return;
    }

    const storageKey = `tryfit_blocked_users_${String(userId)}`;
    let localBlocked = [];

    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || "[]");
      if (Array.isArray(stored)) {
        localBlocked = stored.map((id) => String(id));
      }
    } catch (error) {
      console.error("Blocked users local storage read failed:", error);
    }

    try {
      const data = await api.getBlockedUsers(userId);
      const serverBlocked = Array.isArray(data)
        ? data.map((id) => String(id))
        : [];
      const mergedBlocked = [...new Set([...localBlocked, ...serverBlocked])];
      setBlockedUserIds(mergedBlocked);
      localStorage.setItem(storageKey, JSON.stringify(mergedBlocked));
    } catch (error) {
      console.error("Blocked users loading failed:", error);
      setBlockedUserIds(localBlocked);
    }
  };

  useEffect(() => {
    loadBlockedUsers(currentUserId);
  }, [currentUserId]);

  const matchedUsers = useMemo(() => {
    const acceptedConnections = connections.filter(
      (connection) =>
        connection.status === "accepted" || connection.status === "connected"
    );

    return acceptedConnections
      .map((connection) => {
        const partnerId =
          String(connection.sender_id) === String(currentUserId)
            ? String(connection.receiver_id)
            : String(connection.sender_id);
        if (blockedUserIds.includes(partnerId)) return null;
        return partners.find((partner) => String(partner.id) === partnerId);
      })
      .filter(Boolean);
  }, [connections, currentUserId, partners]);

  const selectedMatch = matchedUsers.find(
    (partner) => String(partner.id) === String(selectedMatchId)
  );

  useEffect(() => {
    if (!selectedMatchId && matchedUsers.length > 0) {
      setSelectedMatchId(String(matchedUsers[0].id));
    }

    if (
      selectedMatchId &&
      matchedUsers.length > 0 &&
      !matchedUsers.some((partner) => String(partner.id) === String(selectedMatchId))
    ) {
      setSelectedMatchId(String(matchedUsers[0].id));
    }

    if (matchedUsers.length === 0) {
      setSelectedMatchId("");
      setChatMessages([]);
    }
  }, [matchedUsers, selectedMatchId]);

  const loadChatMessages = async (partnerId) => {
    if (!currentUserId || !partnerId) return;

    setChatLoading(true);
    try {
      const data = await api.getMessages(currentUserId, partnerId);
      setChatMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Chat loading failed:", error);
      setChatMessages([]);
      setNotice(error.message || "Could not load chat.");
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    if (selectedMatchId) {
      loadChatMessages(selectedMatchId);
    }
  }, [selectedMatchId, currentUserId]);

  const handleSendMessage = async (event) => {
    event.preventDefault();

    const text = chatText.trim();
    if (!text || !currentUserId || !selectedMatchId || sendingMessage) return;

    setSendingMessage(true);
    try {
      const sent = await api.sendMessage(currentUserId, selectedMatchId, text);
      setChatMessages((previous) => [...previous, sent]);
      setChatText("");
    } catch (error) {
      console.error("Message send failed:", error);
      setNotice(error.message || "Could not send message.");
    } finally {
      setSendingMessage(false);
    }
  };


  const handleOpenProfile = (partner) => {
    setProfileViewUser(partner);
    setShowReportModal(false);
  };

  const handleReportUser = async () => {
    if (!currentUserId || !profileViewUser || safetyBusy) return;
    setSafetyBusy(true);
    try {
      await api.reportUser(currentUserId, profileViewUser.id, reportReason, reportDetails.trim());
      setShowReportModal(false);
      setReportDetails("");
      setNotice("Thanks. Your report has been submitted.");
    } catch (error) {
      setNotice(error.message || "Could not submit the report.");
    } finally {
      setSafetyBusy(false);
    }
  };

  const handleBlockUser = async () => {
    if (!currentUserId || !profileViewUser || safetyBusy) return;
    const confirmed = window.confirm(`Block ${profileViewUser.name || "this user"}? They will disappear from Discover and Matches.`);
    if (!confirmed) return;
    setSafetyBusy(true);
    try {
      await api.blockUser(currentUserId, profileViewUser.id);
      const blockedId = String(profileViewUser.id);
      setBlockedUserIds((previous) => {
        const updated = [...new Set([...previous, blockedId])];
        try {
          localStorage.setItem(
            `tryfit_blocked_users_${String(currentUserId)}`,
            JSON.stringify(updated)
          );
        } catch (error) {
          console.error("Blocked users local storage write failed:", error);
        }
        return updated;
      });
      setUsers((previous) =>
        previous.filter((user) => String(user.id) !== blockedId)
      );
      setConnections((previous) => previous.filter((connection) =>
        ![connection.sender_id, connection.receiver_id].map(String).includes(blockedId)
      ));
      setProfileViewUser(null);
      setShowReportModal(false);
      setNotice(`${profileViewUser.name || "User"} has been blocked.`);
    } catch (error) {
      setNotice(error.message || "Could not block this user.");
    } finally {
      setSafetyBusy(false);
    }
  };

  const handleConnect = async (partner) => {

    if (!currentUserId) {

      setNotice("Please select an account first.");

      return;

    }



    if (String(currentUserId) === String(partner.id)) {

      setNotice("You cannot connect with your own account.");

      return;

    }



    if (busyPartner === partner.id) return;



    const existingConnection = getConnection(partner.id);



    if (existingConnection) {

      if (

        existingConnection.status === "accepted" ||

        existingConnection.status === "connected"

      ) {

        setNotice(`You are already connected with ${partner.name}.`);

        return;

      }



      if (existingConnection.status === "pending") {

        if (

          String(existingConnection.receiver_id) === String(currentUserId)

        ) {

          setNotice(`You have a request from ${partner.name}.`);

        } else {

          setNotice(`Your request to ${partner.name} is already pending.`);

        }

        return;

      }



      // A rejected request may be sent again. The backend resets it to pending.

      if (existingConnection.status !== "rejected") {

        setNotice("This connection cannot be updated right now.");

        return;

      }

    }



    setBusyPartner(partner.id);



    try {

      await api.createConnection(currentUserId, partner.id);

      await loadConnections();

      setNotice(`Connection request sent to ${partner.name}! 💚`);

    } catch (error) {

      console.error("Connection request failed:", error);



      if (error.message?.includes("already exists")) {

        setNotice("A connection request already exists.");

        await loadConnections().catch(console.error);

      } else {

        setNotice(

          error.message || "Could not send connection request. Please try again."

        );

      }

    } finally {

      setBusyPartner(null);

    }

  };





  const handleConnectionResponse = async (



    connection,



    action,



    partnerName



  ) => {



    if (!currentUserId || !connection?.id) {



      setNotice("Connection details are missing.");



      return;



    }







    const partnerId =



      String(connection.sender_id) === String(currentUserId)



        ? String(connection.receiver_id)



        : String(connection.sender_id);







    if (busyPartner === partnerId) return;







    setBusyPartner(partnerId);







    try {



      if (action === "accept") {



        await api.acceptConnection(connection.id, currentUserId);



        setNotice(`You are now connected with ${partnerName}! 💚`);



      } else {



        await api.rejectConnection(connection.id, currentUserId);



        setNotice(`Connection request from ${partnerName} rejected.`);



      }







      await loadConnections();



    } catch (error) {



      console.error("Connection response failed:", error);



      setNotice(error.message || "Could not update connection.");



    } finally {



      setBusyPartner(null);



    }



  };







  const handleJoinGame = async (game) => {



    const gameId = String(game.id);







    if (busyGame === gameId) return;







    setBusyGame(gameId);







    try {



      if (joinedGames.includes(gameId)) {



        await api.leaveGame(gameId);







        setJoinedGames((previous) =>



          previous.filter((id) => id !== gameId)



        );







        setNotice(`You left ${game.title}.`);



      } else {



        if (game.players >= game.total) {



          setNotice("This game is already full.");



          return;



        }







        await api.joinGame(gameId);







        setJoinedGames((previous) =>



          previous.includes(gameId) ? previous : [...previous, gameId]



        );







        setNotice(`You're in! Joined ${game.title}. 🎉`);



      }







      await loadGames();



    } catch (error) {



      console.error("Game action failed:", error);



      setNotice("Could not update the game. Please try again.");



    } finally {



      setBusyGame(null);



    }



  };







  const handleCreateGame = async (event) => {



    event.preventDefault();







    if (!gameTitle.trim() || !gameLocation.trim() || !gameDate || !gameTime) {



      setNotice("Please fill in all game details.");



      return;



    }







    try {



      const created = await api.createGame({



        title: gameTitle.trim(),



        activity: gameActivity,



        location: gameLocation.trim(),



        date: gameDate,



        time: gameTime,



        total: Number(gameCapacity),



        host: currentUser?.name || "TryFit member",



      });







      await loadGames();







      const createdId = created?.id ?? created?._id;







      if (createdId) {



        setJoinedGames((previous) => [



          ...new Set([...previous, String(createdId)]),



        ]);



      }







      setShowGameForm(false);



      setGameTitle("");



      setGameLocation("");



      setGameDate("");



      setGameTime("");



      setGameCapacity("4");



      setNotice("Your game has been created! 💚");



    } catch (error) {



      console.error("Create game failed:", error);



      setNotice("Could not create the game. Please try again.");



    }



  };







  const scrollTo = (id) => {



    document.getElementById(id)?.scrollIntoView({



      behavior: "smooth",



      block: "start",



    });



  };







  return (



    <div className="app">



      <header className="navbar">



        <a className="brand" href="#home" aria-label="TryFit home">



          <span className="brand-icon">T</span>



          <span>



            try<span className="brand-highlight">fit</span>



          </span>



          <span className="brand-dot">.</span>



        </a>







        <nav className="nav-links">
          <a href="#discover" onClick={(event) => { event.preventDefault(); openAuthOrScroll("discover"); }}>Discover</a>
          <a href="#partners" onClick={(event) => { event.preventDefault(); openAuthOrScroll("partners"); }}>Find a Partner</a>
          <a href="#matches" onClick={(event) => { event.preventDefault(); openAuthOrScroll("matches"); }}>Matches & Chat</a>
          <a href="#community" onClick={(event) => { event.preventDefault(); openAuthOrScroll("community"); }}>Community</a>
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {!googleUser ? (
            <button type="button" className="nav-cta" onClick={() => setShowGoogleLogin(true)}>
              Sign in with Google <span>↗</span>
            </button>
          ) : (
            <button type="button" className="nav-cta" onClick={handleGoogleLogout} title={googleUser.email || "Google account"}>
              {googleUser.name?.split(" ")[0] || "Account"} · Sign out
            </button>
          )}

          <button type="button" className="nav-cta" onClick={() => openAuthOrScroll("discover")}>
            Get started <span>↗</span>
          </button>
        </div>



      </header>







      {showGoogleLogin && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="google-login-title"
          onClick={() => setShowGoogleLogin(false)}
          style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)" }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{ width: "min(420px, 100%)", padding: "30px", borderRadius: "22px", border: "1px solid #2d412d", background: "#101711", boxShadow: "0 24px 80px rgba(0,0,0,0.45)", textAlign: "center" }}
          >
            <div style={{ fontSize: "34px", marginBottom: "10px" }}>T</div>
            <span className="section-kicker">WELCOME TO TRYFIT</span>
            <h2 id="google-login-title" style={{ margin: "8px 0" }}>Find your people.</h2>
            <p style={{ color: "#9aa69e", margin: "0 auto 24px", maxWidth: "320px" }}>
              Sign in with Google to create or access your TryFit fitness profile.
            </p>
            <div id="google-signin-button" style={{ minHeight: "44px", display: "flex", justifyContent: "center" }} />
            {!googleReady && <p style={{ color: "#9aa69e", fontSize: "13px", marginTop: "12px" }}>Loading Google sign-in…</p>}
            {googleSigningIn && <p style={{ color: "#c8ff4d", fontSize: "13px", marginTop: "12px" }}>Signing you in…</p>}
            <button type="button" className="button button-connected" onClick={() => setShowGoogleLogin(false)} style={{ marginTop: "18px", width: "100%" }}>Cancel</button>
          </div>
        </div>
      )}

      <main>



        <section className="hero" id="home">



          <div className="hero-overlay" />







          <div className="hero-content">



            <div className="eyebrow">



              <span className="eyebrow-dot" />



              YOUR FITNESS, YOUR COMMUNITY



            </div>







            <h1>



              Find your fit.



              <br />



              <span>Find your people.</span>



            </h1>







            <p>



              Discover activities, meet workout partners, and make every



              fitness journey a little more fun.



            </p>







            <div className="hero-actions">



              <button



                className="button button-primary"



                onClick={() => openAuthOrScroll("discover")}



              >



                Explore activities <span>↗</span>



              </button>







              <button



                className="button button-ghost"



                onClick={() => openAuthOrScroll("partners")}



              >



                Find a partner



              </button>



            </div>







            <div className="hero-proof">



              <div className="avatar-stack">



                <span>V</span>



                <span>A</span>



                <span>R</span>



                <span>M</span>



              </div>



              <div>



                <strong>Move together.</strong>



                <small>Good energy starts here.</small>



              </div>



            </div>



          </div>







          <div className="hero-floating-card">



            <span className="floating-icon">✦</span>



            <div>



              <strong>Make movement social.</strong>



              <small>Find your next activity buddy.</small>



            </div>



          </div>



        </section>







        <section className="stats-strip">



          <div>



            <strong>01</strong>



            <span>Discover activities</span>



          </div>



          <div>



            <strong>02</strong>



            <span>Connect with people</span>



          </div>



          <div>



            <strong>03</strong>



            <span>Move together</span>



          </div>



        </section>







        <section className="section discover-section" id="discover">



          <div className="section-heading">



            <div>



              <span className="section-kicker">EXPLORE YOUR OPTIONS</span>



              <h2>What moves you?</h2>



              <p>Choose your vibe. We'll help you find an activity.</p>



            </div>



            <span className="section-number">01 / DISCOVER</span>



          </div>







          <div className="preference-panel">



            <div className="preference-title">



              <div>



                <span className="mini-label">



                  PERSONALISE YOUR EXPERIENCE



                </span>



                <h3>Build your fitness vibe</h3>



              </div>



              <span className="sparkle">✦</span>



            </div>







            <div className="preference-grid">



              <label>



                <span>Your goal</span>



                <select value={goal} onChange={(e) => setGoal(e.target.value)}>



                  <option>Fitness</option>



                  <option>Muscle building</option>



                  <option>Flexibility</option>



                  <option>Social</option>



                  <option>Weight management</option>



                </select>



              </label>







              <label>



                <span>Available time</span>



                <select



                  value={duration}



                  onChange={(e) => setDuration(e.target.value)}



                >



                  <option>Any</option>



                  <option>15–30 min</option>



                  <option>30–60 min</option>



                </select>



              </label>







              <label>



                <span>Intensity</span>



                <select



                  value={intensity}



                  onChange={(e) => setIntensity(e.target.value)}



                >



                  <option>Any</option>



                  <option>Low</option>



                  <option>Medium</option>



                  <option>High</option>



                </select>



              </label>







              <label>



                <span>Where?</span>



                <select



                  value={location}



                  onChange={(e) => setLocation(e.target.value)}



                >



                  <option>Any</option>



                  <option>Indoor</option>



                  <option>Outdoor</option>



                  <option>Gym</option>



                </select>



              </label>



            </div>



          </div>







          <div className="recommendation-heading">



            <div>



              <span className="section-kicker">MADE FOR YOUR GOALS</span>



              <h3>Recommended for you</h3>



            </div>



            <span className="recommendation-tag">✦ Personalised picks</span>



          </div>







          <div className="activity-grid recommendation-grid">



            {recommendedActivities.map((activity) => (



              <article



                className="activity-card recommended-card"



                key={activity.id}



              >



                <div className="activity-card-top">



                  <span className="activity-icon">{activity.icon}</span>



                  <span className="match-badge">For your goal</span>



                </div>







                <span className="activity-category">{activity.category}</span>



                <h4>{activity.name}</h4>



                <p>{activity.description}</p>







                <div className="activity-meta">



                  <span>◷ {activity.duration}</span>



                  <span>↗ {activity.intensity}</span>



                </div>







                <button



                  className="text-button"



                  onClick={() => {



                    setSelectedCategory("All");



                    setSearch(activity.name);



                    scrollTo("activity-list");



                  }}



                >



                  Explore activity <span>→</span>



                </button>



              </article>



            ))}



          </div>







          <div className="activity-list-heading" id="activity-list">



            <div>



              <span className="section-kicker">FIND YOUR NEXT MOVE</span>



              <h3>Explore activities</h3>



              <small className="demo-note">API status: {apiStatus}</small>



            </div>







            <div className="search-box">



              <span>⌕</span>



              <input



                type="search"



                placeholder="Search activities..."



                value={search}



                onChange={(e) => setSearch(e.target.value)}



              />



            </div>



          </div>







          <div className="category-tabs">



            {categories.map((category) => (



              <button



                key={category}



                className={



                  selectedCategory === category



                    ? "category-tab active"



                    : "category-tab"



                }



                onClick={() => setSelectedCategory(category)}



              >



                {category}



              </button>



            ))}



          </div>







          <div className="activity-grid">



            {filteredActivities.map((activity) => (



              <article className="activity-card" key={activity.id}>



                <div className="activity-card-top">



                  <span className="activity-icon">{activity.icon}</span>



                  <span className="activity-category">



                    {activity.category}



                  </span>



                </div>







                <h4>{activity.name}</h4>



                <p>{activity.description}</p>







                <div className="activity-meta">



                  <span>◷ {activity.duration}</span>



                  <span>↗ {activity.intensity}</span>



                </div>







                <button



                  className="text-button"



                  onClick={() => {



                    setActiveActivity(activity.name);



                    scrollTo("partners");



                  }}



                >



                  Find a partner <span>→</span>



                </button>



              </article>



            ))}



          </div>







          {filteredActivities.length === 0 && (



            <div className="empty-state">



              <span>🔎</span>



              <h4>No activities found</h4>



              <p>Try changing your search or filters.</p>



              <button



                className="text-button"



                onClick={() => {



                  setSearch("");



                  setSelectedCategory("All");



                  setDuration("Any");



                  setIntensity("Any");



                  setLocation("Any");



                }}



              >



                Clear filters →



              </button>



            </div>



          )}



        </section>







        <section className="partner-section" id="partners">



          <div className="section">



            <div className="section-heading">



              <div>



                <span className="section-kicker">BETTER TOGETHER</span>



                <h2>Meet your movement people.</h2>



                <p>



                  Find someone who shares your energy and fitness goals.



                </p>



              </div>



              <span className="section-number">02 / CONNECT</span>



            </div>







            {currentUser && filteredPartners.length > 0 && (
              <div style={{ marginTop: "22px", marginBottom: "22px", padding: "24px", borderRadius: "22px", background: "linear-gradient(135deg, #07111F 0%, #10283A 100%)", color: "#F8FAFC", border: "1px solid rgba(24, 168, 245, 0.35)", boxShadow: "0 18px 45px rgba(7, 17, 31, 0.14)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                  <div>
                    <span style={{ fontSize: "11px", letterSpacing: "0.14em", fontWeight: 800, color: "#35D36B" }}>✨ YOUR TOP FITNESS MATCH</span>
                    <h3 style={{ margin: "8px 0 4px", fontSize: "28px" }}>{filteredPartners[0].name}{filteredPartners[0].age ? `, ${filteredPartners[0].age}` : ""}</h3>
                    <p style={{ margin: 0, color: "#C9D5DE" }}>{filteredPartners[0].city || "Location not specified"} · {filteredPartners[0].activity || "Fitness"}</p>
                  </div>
                  <div style={{ minWidth: "110px", textAlign: "center", padding: "12px 16px", borderRadius: "16px", background: "rgba(255,255,255,0.08)" }}>
                    <strong style={{ display: "block", fontSize: "32px", color: "#35D36B" }}>{filteredPartners[0].match.score}%</strong>
                    <span style={{ fontSize: "12px", color: "#C9D5DE" }}>Fitness Chemistry</span>
                  </div>
                </div>
                <div style={{ marginTop: "18px" }}>
                  <strong>Why you match</strong>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px" }}>
                    {filteredPartners[0].match.reasons.map((reason) => (
                      <span key={reason} style={{ padding: "8px 11px", borderRadius: "999px", background: "rgba(53, 211, 107, 0.12)", color: "#D9FFE4", fontSize: "13px" }}>✓ {reason}</span>
                    ))}
                    {!filteredPartners[0].match.reasons.length && <span style={{ color: "#C9D5DE", fontSize: "13px" }}>Complete more of your fitness profile to improve this match.</span>}
                  </div>
                </div>
                <div style={{ marginTop: "18px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button type="button" className="button button-primary" disabled={busyPartner === filteredPartners[0].id} onClick={() => handleConnect(filteredPartners[0])}>
                    {busyPartner === filteredPartners[0].id ? "Connecting..." : "💚 Connect with this match"}
                  </button>
                  <button type="button" className="button button-connected" onClick={() => handleOpenProfile(filteredPartners[0])}>View profile ↓</button>
                </div>
              </div>
            )}

            <div className="partner-toolbar">



              <div className="category-tabs">



                {partnerActivities.map((activity) => (



                  <button



                    key={activity}



                    className={



                      activeActivity === activity



                        ? "category-tab active"



                        : "category-tab"



                    }



                    onClick={() => setActiveActivity(activity)}



                  >



                    {activity}



                  </button>



                ))}



              </div>







              <label



                style={{



                  display: "flex",



                  flexDirection: "column",



                  gap: "6px",



                  minWidth: "190px",



                  color: "inherit",



                  fontSize: "13px",



                }}



              >



                <span>Viewing as</span>



                <select



                  value={currentUserId}



                  onChange={(e) => setCurrentUserId(e.target.value)}



                  disabled={usersLoading || users.length === 0}



                  style={{



                    padding: "10px",



                    borderRadius: "10px",



                    border: "1px solid #d5ded7",



                    background: "#fff",



                    color: "#263b2f",



                    maxWidth: "260px",



                  }}



                >



                  {users.map((user) => (



                    <option key={user.id} value={user.id}>



                      {user.name} — {user.email}



                    </option>



                  ))}



                </select>



              </label>



            </div>







            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
              <button
                type="button"
                className="button button-primary"
                onClick={() => setIsEditingProfile((value) => !value)}
                disabled={!currentUser || usersLoading}
              >
                {isEditingProfile ? "Close editor" : "✏️ Edit profile"}
              </button>
            </div>

            {isEditingProfile && currentUser && (
              <form
                onSubmit={handleSaveProfile}
                style={{
                  marginTop: "18px",
                  padding: "24px",
                  borderRadius: "22px",
                  border: "1px solid #d5ded7",
                  background: "#f8fbf8",
                }}
              >
                <div style={{ marginBottom: "20px" }}>
                  <span className="section-kicker">YOUR PROFILE</span>
                  <h3 style={{ margin: "6px 0 4px" }}>Complete your TryFit profile</h3>
                  <p style={{ margin: 0, color: "#64736a" }}>
                    Complete your profile so TryFit can show you better fitness partners and matches.
                  </p>
                </div>

                <div style={{ display: "grid", gap: "22px" }}>
                  <section>
                    <div style={{ marginBottom: "12px" }}>
                      <strong style={{ fontSize: "16px" }}>👤 Basic information</strong>
                      <p style={{ margin: "4px 0 0", color: "#718078", fontSize: "13px" }}>Your basic details and how the community sees you.</p>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "14px" }}>
                      <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        Name
                        <input value={profileForm.name} onChange={(e) => handleProfileChange("name", e.target.value)} placeholder="Your name" required />
                      </label>

                      <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        Email
                        <input value={currentUser.email || ""} readOnly disabled title="Email cannot be changed here" />
                      </label>

                      <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        Age
                        <input type="number" min="16" max="100" value={profileForm.age} onChange={(e) => handleProfileChange("age", e.target.value)} placeholder="Your age" required />
                      </label>

                      <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        Gender
                        <select value={profileForm.gender} onChange={(e) => handleProfileChange("gender", e.target.value)}>
                          <option value="">Select gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Non-binary">Non-binary</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                      </label>

                      <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        City
                        <input value={profileForm.city} onChange={(e) => handleProfileChange("city", e.target.value)} placeholder="e.g. Mumbai" required />
                      </label>

                      <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        Hometown
                        <input value={profileForm.hometown} onChange={(e) => handleProfileChange("hometown", e.target.value)} placeholder="Where are you from?" />
                      </label>

                      <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        Height (cm)
                        <input type="number" min="100" max="250" value={profileForm.height_cm} onChange={(e) => handleProfileChange("height_cm", e.target.value)} placeholder="e.g. 175" />
                      </label>

                      <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        Profession
                        <input value={profileForm.profession} onChange={(e) => handleProfileChange("profession", e.target.value)} placeholder="Student, developer, designer..." />
                      </label>

                      <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        Education
                        <input value={profileForm.education} onChange={(e) => handleProfileChange("education", e.target.value)} placeholder="College / degree" />
                      </label>
                    </div>

                    <label style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "14px" }}>
                      Languages
                      <input
                        value={profileForm.languages.join(", ")}
                        onChange={(e) => handleProfileChange("languages", e.target.value.split(",").map((item) => item.trim()).filter(Boolean))}
                        placeholder="English, Hindi, Marathi"
                      />
                      <small style={{ color: "#718078" }}>Separate multiple languages with commas.</small>
                    </label>
                  </section>

                  <section>
                    <div style={{ marginBottom: "12px" }}>
                      <strong style={{ fontSize: "16px" }}>📱 Contact & media</strong>
                      <p style={{ margin: "4px 0 0", color: "#718078", fontSize: "13px" }}>Add contact and profile media information.</p>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "14px" }}>
                      <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        Phone number
                        <input type="tel" value={profileForm.phone_number} onChange={(e) => handleProfileChange("phone_number", e.target.value)} placeholder="Your phone number" />
                        <small style={{ color: "#718078" }}>
                          {profileForm.phone_verified ? "✓ Phone verified" : "Phone not verified"}
                        </small>
                      </label>

                      <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        Profile photo URL
                        <input value={profileForm.profile_photo} onChange={(e) => handleProfileChange("profile_photo", e.target.value)} placeholder="https://..." />
                      </label>

                      <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        Fitness video URL
                        <input value={profileForm.fitness_video_url} onChange={(e) => handleProfileChange("fitness_video_url", e.target.value)} placeholder="Optional video URL" />
                      </label>
                    </div>

                    {profileForm.profile_photo && (
                      <div style={{ marginTop: "14px", display: "flex", alignItems: "center", gap: "12px" }}>
                        <img
                          src={profileForm.profile_photo}
                          alt="Profile preview"
                          style={{ width: "72px", height: "72px", borderRadius: "18px", objectFit: "cover", border: "1px solid #d5ded7" }}
                          onError={(event) => { event.currentTarget.style.display = "none"; }}
                        />
                        <span style={{ fontSize: "13px", color: "#718078" }}>Profile photo preview</span>
                      </div>
                    )}

                    <label style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "14px" }}>
                      Additional photo URLs
                      <textarea
                        value={profileForm.additional_photos.join("\n")}
                        onChange={(e) => handleProfileChange("additional_photos", e.target.value.split("\n").map((item) => item.trim()).filter(Boolean))}
                        rows="3"
                        placeholder="One image URL per line"
                      />
                    </label>
                  </section>

                  <section>
                    <div style={{ marginBottom: "12px" }}>
                      <strong style={{ fontSize: "16px" }}>🏋️ Fitness profile</strong>
                      <p style={{ margin: "4px 0 0", color: "#718078", fontSize: "13px" }}>Tell us what you like to do and how you train.</p>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "14px" }}>
                      <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        Primary activity
                        <select value={profileForm.activity} onChange={(e) => handleProfileChange("activity", e.target.value)}>
                          <option value="">Select activity</option>
                          {activityList.map((activity) => (
                            <option key={activity.id} value={activity.name}>{activity.name}</option>
                          ))}
                        </select>
                      </label>

                      <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        Fitness level
                        <select value={profileForm.level} onChange={(e) => handleProfileChange("level", e.target.value)}>
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                          <option value="Competitive">Competitive</option>
                        </select>
                      </label>

                      <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        Workout frequency
                        <select value={profileForm.workout_frequency} onChange={(e) => handleProfileChange("workout_frequency", e.target.value)}>
                          <option value="">How often do you train?</option>
                          <option value="1-2 times a week">1–2 times a week</option>
                          <option value="3-4 times a week">3–4 times a week</option>
                          <option value="5-6 times a week">5–6 times a week</option>
                          <option value="Every day">Every day</option>
                        </select>
                      </label>

                      <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        Training intensity
                        <select value={profileForm.training_intensity} onChange={(e) => handleProfileChange("training_intensity", e.target.value)}>
                          <option value="">Select intensity</option>
                          <option value="Low">Low</option>
                          <option value="Moderate">Moderate</option>
                          <option value="High">High</option>
                          <option value="Very high">Very high</option>
                        </select>
                      </label>
                    </div>

                    {[
                      ["Sports you enjoy", "sports", ["Gym", "Running", "Football", "Cricket", "Badminton", "Basketball", "Swimming", "Tennis", "Cycling", "Boxing", "Yoga", "CrossFit", "Hiking", "Table Tennis", "Volleyball", "Golf", "Dance"]],
                      ["Fitness goals", "goals", ["Build muscle", "Lose weight", "Improve stamina", "Stay active", "Improve flexibility", "Train for competition", "Have fun", "Meet people"]],
                      ["Activity preferences", "activity_preferences", ["Indoor", "Outdoor", "Gym", "Home", "Park", "Court", "Track", "Pool", "Group classes"]],
                    ].map(([title, field, options]) => (
                      <div key={field} style={{ marginTop: "18px" }}>
                        <strong>{title}</strong>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px" }}>
                          {options.map((item) => {
                            const selected = profileForm[field].includes(item);
                            return (
                              <button
                                type="button"
                                key={item}
                                className={selected ? "button button-primary" : "button button-connected"}
                                onClick={() => handleProfileChange(field, toggleProfileListValue(profileForm[field], item))}
                              >
                                {selected ? "✓ " : ""}{item}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </section>

                  <section>
                    <div style={{ marginBottom: "12px" }}>
                      <strong style={{ fontSize: "16px" }}>🗓️ Availability</strong>
                      <p style={{ margin: "4px 0 0", color: "#718078", fontSize: "13px" }}>Choose when you usually want to work out.</p>
                    </div>

                    <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      Availability
                      <select value={profileForm.availability} onChange={(e) => handleProfileChange("availability", e.target.value)}>
                        <option value="Flexible">Flexible</option>
                        <option value="Morning">Morning</option>
                        <option value="Afternoon">Afternoon</option>
                        <option value="Evening">Evening</option>
                        <option value="Night">Night</option>
                        <option value="Weekends">Weekends</option>
                      </select>
                    </label>

                    {[
                      ["Preferred workout days", "preferred_days", ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]],
                      ["Preferred workout times", "preferred_times", ["Morning", "Afternoon", "Evening", "Night"]],
                    ].map(([title, field, options]) => (
                      <div key={field} style={{ marginTop: "18px" }}>
                        <strong>{title}</strong>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px" }}>
                          {options.map((item) => {
                            const selected = profileForm[field].includes(item);
                            return (
                              <button
                                type="button"
                                key={item}
                                className={selected ? "button button-primary" : "button button-connected"}
                                onClick={() => handleProfileChange(field, toggleProfileListValue(profileForm[field], item))}
                              >
                                {selected ? "✓ " : ""}{item}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </section>

                  <section>
                    <div style={{ marginBottom: "12px" }}>
                      <strong style={{ fontSize: "16px" }}>🤝 Matching preferences</strong>
                      <p style={{ margin: "4px 0 0", color: "#718078", fontSize: "13px" }}>These preferences help TryFit find compatible partners.</p>
                    </div>

                    {[
                      ["What are you looking for?", "looking_for", ["Workout partner", "Sports partner", "Running partner", "Competition partner", "Accountability partner", "Try new activities"]],
                      ["Fitness personality", "personality", ["Competitive", "Disciplined", "Casual", "Fun / Social", "Goal-oriented", "Chill", "Competition-focused"]],
                    ].map(([title, field, options]) => (
                      <div key={field} style={{ marginTop: "14px" }}>
                        <strong>{title}</strong>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px" }}>
                          {options.map((item) => {
                            const selected = profileForm[field].includes(item);
                            return (
                              <button
                                type="button"
                                key={item}
                                className={selected ? "button button-primary" : "button button-connected"}
                                onClick={() => handleProfileChange(field, toggleProfileListValue(profileForm[field], item))}
                              >
                                {selected ? "✓ " : ""}{item}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", marginTop: "18px" }}>
                      <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        Preferred age — minimum
                        <input type="number" min="16" max="100" value={profileForm.preferred_age_min} onChange={(e) => handleProfileChange("preferred_age_min", e.target.value)} />
                      </label>

                      <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        Preferred age — maximum
                        <input type="number" min="16" max="100" value={profileForm.preferred_age_max} onChange={(e) => handleProfileChange("preferred_age_max", e.target.value)} />
                      </label>

                      <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        Preferred distance (km)
                        <input type="number" min="1" max="200" value={profileForm.preferred_distance_km} onChange={(e) => handleProfileChange("preferred_distance_km", e.target.value)} />
                      </label>
                    </div>
                  </section>

                  <section>
                    <div style={{ marginBottom: "12px" }}>
                      <strong style={{ fontSize: "16px" }}>✍️ About you</strong>
                      <p style={{ margin: "4px 0 0", color: "#718078", fontSize: "13px" }}>Add a short bio and answer a few fitness prompts.</p>
                    </div>

                    <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      Bio
                      <textarea
                        value={profileForm.bio}
                        onChange={(e) => handleProfileChange("bio", e.target.value)}
                        placeholder="Tell the TryFit community a little about yourself..."
                        rows="5"
                        maxLength="500"
                      />
                      <small style={{ color: "#718078", textAlign: "right" }}>{profileForm.bio.length}/500</small>
                    </label>

                    <div style={{ marginTop: "16px" }}>
                      <strong>Fitness prompts</strong>
                      <div style={{ display: "grid", gap: "12px", marginTop: "10px" }}>
                        {profileForm.prompts.map((prompt, index) => (
                          <label key={`${prompt.question}-${index}`} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            {prompt.question}
                            <input
                              value={prompt.answer}
                              onChange={(e) => {
                                const updatedPrompts = [...profileForm.prompts];
                                updatedPrompts[index] = { ...updatedPrompts[index], answer: e.target.value };
                                handleProfileChange("prompts", updatedPrompts);
                              }}
                              placeholder="Write your answer..."
                              maxLength="180"
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  </section>
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "22px", paddingTop: "18px", borderTop: "1px solid #d5ded7", flexWrap: "wrap" }}>
                  <button type="submit" className="button button-primary" disabled={profileSaving}>
                    {profileSaving ? "Saving profile..." : "💾 Save profile"}
                  </button>

                  <button
                    type="button"
                    className="button button-connected"
                    disabled={profileSaving}
                    onClick={() => {
                      setProfileForm(createProfileForm(currentUser));
                      setIsEditingProfile(false);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <p className="demo-note" style={{ marginTop: "12px" }}>



              {usersLoading



                ? "Loading registered members..."



                : `${partners.length} other registered member(s) · Live user data`}



            </p>







            {!usersLoading && users.length === 0 && (



              <div className="empty-state">



                <span>👋</span>



                <h4>No registered users yet</h4>



                <p>



                  Create user accounts to start discovering fitness partners.



                </p>



              </div>



            )}







            <div className="partner-grid">



              {filteredPartners.map((partner) => {



                const connection = getConnection(partner.id);







                const isSent =



                  connection &&



                  String(connection.sender_id) === String(currentUserId);







                const isReceived =



                  connection &&



                  String(connection.receiver_id) === String(currentUserId);







                const isAccepted =



  connection?.status === "accepted" ||



  connection?.status === "connected";







const isRejected = connection?.status === "rejected";







let buttonText = "＋ Connect";







if (isAccepted) {



  buttonText = "✓ Connected";



} else if (isRejected) {



  buttonText = "↻ Connect Again";



} else if (isSent) {



  buttonText = "✓ Request sent";



} else if (isReceived) {



  buttonText = "Request received";



}







                return (



                  <article className="partner-card" id={`partner-${partner.id}`} key={partner.id}>



                    <div className="partner-card-top">



                      <div className={`partner-avatar ${partner.color}`}>



                        {partner.avatar}



                        <span className="online-dot" />



                      </div>







                      <span className="compatibility">



                        <strong>{partner.match.score}% match</strong>



                        <small>Fitness Chemistry</small>



                      </span>



                    </div>







                    <h3>



                      {partner.name}



                      {partner.age ? `, ${partner.age}` : ""}



                    </h3>







                    <p className="partner-location">



                      ⌖ {partner.city || "Location not specified"}



                    </p>







                    <p className="partner-bio">



                      {partner.bio || "Looking for a fitness partner."}



                    </p>







                    <div className="partner-tags">



                      <span>{partner.activity || "Fitness"}</span>



                      <span>{partner.level || "Level not specified"}</span>



                      <span>{partner.availability || "Flexible"}</span>



                    </div>



                    <div style={{ marginTop: "12px" }}>
                      <strong style={{ fontSize: "13px" }}>Why you match</strong>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "7px" }}>
                        {partner.match.reasons.slice(0, 3).map((reason) => (
                          <span key={reason} style={{ fontSize: "11px", padding: "5px 8px", borderRadius: "999px", background: "#eef8f1", color: "#31533d" }}>✓ {reason}</span>
                        ))}
                        {!partner.match.reasons.length && <span style={{ fontSize: "11px", color: "#718078" }}>Complete more profile fields to improve this match.</span>}
                      </div>
                    </div>







                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" }}>
                      <button type="button" className="button button-connected" onClick={() => handleOpenProfile(partner)}>
                        View profile
                      </button>
                      <button
                        type="button"
                        className="button button-connected"
                        onClick={() => handlePassUser(partner)}
                        disabled={busyPartner === partner.id}
                        style={{ flex: 1 }}
                      >
                        ✕ Pass
                      </button>
                    </div>

                    {isReceived && connection.status === "pending" ? (



                      <div



                        style={{



                          display: "flex",



                          gap: "10px",



                          marginTop: "12px",



                        }}



                      >



                        <button



                          className="button button-primary"



                          style={{ flex: 1 }}



                          disabled={busyPartner === partner.id}



                          onClick={() =>



                            handleConnectionResponse(



                              connection,



                              "accept",



                              partner.name



                            )



                          }



                        >



                          {busyPartner === partner.id



                            ? "Updating..."



                            : "✓ Accept"}



                        </button>







                        <button



                          className="button button-connected"



                          style={{ flex: 1 }}



                          disabled={busyPartner === partner.id}



                          onClick={() =>



                            handleConnectionResponse(



                              connection,



                              "reject",



                              partner.name



                            )



                          }



                        >



                          Reject



                        </button>



                      </div>



                    ) : (



                      <button



                        className={

                          isAccepted || (connection && !isRejected)

                            ? "button button-connected"

                            : "button button-primary partner-button"

                        }

                        disabled={

                          isAccepted ||

                          (Boolean(connection) && !isRejected) ||

                          busyPartner === partner.id

                        }



                        onClick={() => handleConnect(partner)}



                      >



                        {busyPartner === partner.id



                          ? "Sending..."



                          : buttonText}



                      </button>



                    )}



                  </article>



                );



              })}



            </div>







            {!usersLoading &&



              partners.length > 0 &&



              filteredPartners.length === 0 && (



                <div className="empty-state">



                  <span>👋</span>



                  <h4>No partners found</h4>



                  <p>Try another activity or search term.</p>



                </div>



              )}



          </div>



        </section>







        <section className="section community-section" id="community">



          <div className="section-heading">



            <div>



              <span className="section-kicker">THE COMMUNITY BOARD</span>



              <h2>Good plans. Good people.</h2>



              <p>Join a game or create your own activity.</p>



            </div>







            <button



              className="button button-primary create-button"



              onClick={() => setShowGameForm((value) => !value)}



            >



              {showGameForm ? "Close form" : "+ Create a game"}



            </button>



          </div>







          {showGameForm && (



            <form className="game-form" onSubmit={handleCreateGame}>



              <div className="game-form-heading">



                <span className="section-kicker">START SOMETHING</span>



                <h3>Create your game</h3>



                <p>Invite people to join your next activity.</p>



              </div>







              <div className="game-form-grid">



                <label>



                  Game title



                  <input



                    value={gameTitle}



                    onChange={(e) => setGameTitle(e.target.value)}



                    placeholder="e.g. Saturday morning run"



                    required



                  />



                </label>







                <label>



                  Activity



                  <select



                    value={gameActivity}



                    onChange={(e) => setGameActivity(e.target.value)}



                  >



                    {activityList.map((activity) => (



                      <option key={activity.id}>{activity.name}</option>



                    ))}



                  </select>



                </label>







                <label>



                  Location



                  <input



                    value={gameLocation}



                    onChange={(e) => setGameLocation(e.target.value)}



                    placeholder="e.g. Bandra, Mumbai"



                    required



                  />



                </label>







                <label>



                  Date



                  <input



                    type="date"



                    value={gameDate}



                    onChange={(e) => setGameDate(e.target.value)}



                    required



                  />



                </label>







                <label>



                  Time



                  <input



                    type="time"



                    value={gameTime}



                    onChange={(e) => setGameTime(e.target.value)}



                    required



                  />



                </label>







                <label>



                  Total players



                  <select



                    value={gameCapacity}



                    onChange={(e) => setGameCapacity(e.target.value)}



                  >



                    <option value="2">2 players</option>



                    <option value="4">4 players</option>



                    <option value="6">6 players</option>



                    <option value="8">8 players</option>



                    <option value="10">10 players</option>



                  </select>



                </label>



              </div>







              <button className="button button-primary" type="submit">



                Publish game ↗



              </button>



            </form>



          )}







          <div className="game-grid">



            {games.map((game) => {



              const joined = joinedGames.includes(String(game.id));



              const full = game.players >= game.total;







              return (



                <article className="game-card" key={game.id}>



                  <div className="game-card-top">



                    <span className="game-icon">{game.icon}</span>



                    <span className={full ? "game-status full" : "game-status"}>



                      {full ? "Full" : "Open"}



                    </span>



                  </div>







                  <span className="activity-category">{game.activity}</span>



                  <h3>{game.title}</h3>







                  <div className="game-details">



                    <span>⌖ {game.location}</span>



                    <span>◷ {game.date} · {game.time}</span>



                    <span>♙ Hosted by {game.host}</span>



                  </div>







                  <div className="player-progress">



                    <div className="player-progress-label">



                      <span>Players</span>



                      <strong>



                        {game.players}/{game.total}



                      </strong>



                    </div>







                    <div className="progress-track">



                      <div



                        className="progress-fill"



                        style={{



                          width: `${



                            game.total > 0



                              ? Math.min(



                                  100,



                                  (game.players / game.total) * 100



                                )



                              : 0



                          }%`,



                        }}



                      />



                    </div>



                  </div>







                  <button



                    className={



                      joined



                        ? "button button-connected"



                        : "button button-primary game-join-button"



                    }



                    disabled={



                      busyGame === String(game.id) || (full && !joined)



                    }



                    onClick={() => handleJoinGame(game)}



                  >



                    {busyGame === String(game.id)



                      ? "Updating..."



                      : joined



                      ? "✓ Joined · Leave"



                      : full



                      ? "Game full"



                      : "Join game →"}



                  </button>



                </article>



              );



            })}



          </div>







          {games.length === 0 && (



            <div className="empty-state">



              <span>🏃</span>



              <h4>No games yet</h4>



              <p>Be the first to create a community activity!</p>



              <button



                className="text-button"



                onClick={() => setShowGameForm(true)}



              >



                Create your first game →



              </button>



            </div>



          )}



        </section>







        <section className="section" id="matches" style={{ paddingTop: "72px" }}>
          <div className="section-heading">
            <span className="section-kicker">💚 MUTUAL MATCHES</span>
            <h2>Fitness people you can <span>move with.</span></h2>
            <p>When both people connect, the match becomes mutual and the chat opens.</p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(250px, 0.75fr) minmax(0, 1.45fr)",
              gap: "18px",
              marginTop: "28px",
            }}
          >
            <div
              style={{
                border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: "22px",
                padding: "18px",
                background: "rgba(255,255,255,0.025)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <strong>Your matches</strong>
                <span style={{ fontSize: "12px", opacity: 0.65 }}>{matchedUsers.length}</span>
              </div>

              {matchedUsers.length === 0 ? (
                <div className="empty-state" style={{ minHeight: "220px" }}>
                  <span>💚</span>
                  <h4>No mutual matches yet</h4>
                  <p>Connect with someone who interests you. Once they accept, your match appears here.</p>
                  <button className="text-button" onClick={() => openAuthOrScroll("partners")}>
                    Find people →
                  </button>
                </div>
              ) : (
                <div style={{ display: "grid", gap: "10px" }}>
                  {matchedUsers.map((partner) => {
                    const isSelected = String(partner.id) === String(selectedMatchId);
                    const match = calculateCompatibility(currentUser, partner);
                    return (
                      <button
                        key={partner.id}
                        type="button"
                        onClick={() => setSelectedMatchId(String(partner.id))}
                        style={{
                          textAlign: "left",
                          border: isSelected ? "1px solid #35d36b" : "1px solid rgba(255,255,255,0.08)",
                          background: isSelected ? "rgba(53,211,107,0.08)" : "rgba(255,255,255,0.025)",
                          color: "inherit",
                          borderRadius: "16px",
                          padding: "13px",
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
                          <div className={`partner-avatar ${partner.color}`} style={{ width: "42px", height: "42px", minWidth: "42px" }}>
                            {partner.avatar}
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <strong style={{ display: "block" }}>{partner.name}{partner.age ? `, ${partner.age}` : ""}</strong>
                            <span style={{ fontSize: "12px", opacity: 0.65 }}>{partner.activity || "Fitness"} · {partner.city || "Location not specified"}</span>
                          </div>
                          <span style={{ color: "#35d36b", fontWeight: 800, fontSize: "13px" }}>{match.score}%</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div
              style={{
                border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: "22px",
                background: "rgba(255,255,255,0.025)",
                minHeight: "420px",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {!selectedMatch ? (
                <div className="empty-state" style={{ margin: "auto", padding: "50px 25px" }}>
                  <span>💬</span>
                  <h4>Your chat will appear here</h4>
                  <p>Make a mutual connection to start talking about your next workout.</p>
                </div>
              ) : (
                <>
                  <div style={{ padding: "18px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div className={`partner-avatar ${selectedMatch.color}`} style={{ width: "46px", height: "46px", minWidth: "46px" }}>
                        {selectedMatch.avatar}
                      </div>
                      <div>
                        <strong style={{ display: "block", fontSize: "17px" }}>{selectedMatch.name}{selectedMatch.age ? `, ${selectedMatch.age}` : ""}</strong>
                        <span style={{ fontSize: "12px", opacity: 0.65 }}>💚 Mutual fitness match</span>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      flex: 1,
                      minHeight: "275px",
                      maxHeight: "390px",
                      overflowY: "auto",
                      padding: "18px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "9px",
                    }}
                  >
                    {chatLoading ? (
                      <div style={{ margin: "auto", opacity: 0.65 }}>Loading conversation...</div>
                    ) : chatMessages.length === 0 ? (
                      <div style={{ margin: "auto", textAlign: "center", maxWidth: "330px", opacity: 0.7 }}>
                        <div style={{ fontSize: "32px", marginBottom: "8px" }}>👋</div>
                        <strong>Say hello!</strong>
                        <p style={{ fontSize: "13px", lineHeight: 1.5 }}>Break the ice with a workout idea, ask about their favourite sport, or plan your first session.</p>
                      </div>
                    ) : (
                      chatMessages.map((message) => {
                        const mine = String(message.sender_id) === String(currentUserId);
                        return (
                          <div key={message.id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
                            <div
                              style={{
                                maxWidth: "75%",
                                padding: "10px 13px",
                                borderRadius: mine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                                background: mine ? "#35d36b" : "rgba(255,255,255,0.08)",
                                color: mine ? "#07111f" : "inherit",
                                fontSize: "14px",
                                lineHeight: 1.45,
                              }}
                            >
                              {message.text}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <form onSubmit={handleSendMessage} style={{ display: "flex", gap: "9px", padding: "14px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <input
                      value={chatText}
                      onChange={(event) => setChatText(event.target.value)}
                      placeholder="Message your fitness match..."
                      maxLength={2000}
                      style={{ flex: 1, minWidth: 0 }}
                    />
                    <button className="button button-primary" type="submit" disabled={!chatText.trim() || sendingMessage}>
                      {sendingMessage ? "Sending..." : "Send →"}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </section>

        {profileViewUser && (
          <div role="dialog" aria-modal="true" aria-label={`${profileViewUser.name || "User"} profile`} onClick={() => setProfileViewUser(null)} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.72)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <div onClick={(event) => event.stopPropagation()} style={{ width: "min(720px, 100%)", maxHeight: "88vh", overflowY: "auto", borderRadius: "24px", background: "#0d1712", border: "1px solid rgba(255,255,255,0.12)", color: "#F8FAFC", padding: "24px", boxShadow: "0 24px 80px rgba(0,0,0,0.4)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                  <div className={`partner-avatar ${profileViewUser.color}`} style={{ width: "58px", height: "58px", minWidth: "58px" }}>{profileViewUser.avatar}</div>
                  <div><h3 style={{ margin: 0, fontSize: "24px" }}>{profileViewUser.name}{profileViewUser.age ? `, ${profileViewUser.age}` : ""}</h3><p style={{ margin: "5px 0 0", opacity: 0.65 }}>{profileViewUser.city || "Location not specified"} · {profileViewUser.activity || "Fitness"}</p></div>
                </div>
                <button type="button" className="button button-connected" onClick={() => setProfileViewUser(null)}>Close</button>
              </div>
              {profileViewUser.profile_photo && <img src={profileViewUser.profile_photo} alt={`${profileViewUser.name || "User"} profile`} style={{ width: "100%", maxHeight: "280px", objectFit: "cover", borderRadius: "18px", marginTop: "18px" }} />}
              <div style={{ marginTop: "20px" }}><strong>About</strong><p style={{ lineHeight: 1.6, opacity: 0.8 }}>{profileViewUser.bio || "This user has not added a bio yet."}</p></div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginTop: "18px" }}>
                {[
                  ["Sports", profileViewUser.sports?.join(", ") || "Not specified"],
                  ["Goals", profileViewUser.goals?.join(", ") || "Not specified"],
                  ["Fitness level", profileViewUser.level || "Not specified"],
                  ["Workout frequency", profileViewUser.workout_frequency || "Not specified"],
                  ["Training intensity", profileViewUser.training_intensity || "Not specified"],
                  ["Availability", profileViewUser.availability || "Flexible"],
                  ["Preferred days", profileViewUser.preferred_days?.join(", ") || "Not specified"],
                  ["Preferred times", profileViewUser.preferred_times?.join(", ") || "Not specified"],
                  ["Looking for", profileViewUser.looking_for?.join(", ") || "Not specified"],
                  ["Personality", profileViewUser.personality?.join(", ") || "Not specified"],
                ].map(([label, value]) => <div key={label} style={{ padding: "13px", borderRadius: "14px", background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.07)" }}><span style={{ display: "block", fontSize: "11px", opacity: 0.55, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span><span style={{ display: "block", marginTop: "5px", fontSize: "13px", lineHeight: 1.45 }}>{value}</span></div>)}
              </div>
              {Array.isArray(profileViewUser.prompts) && profileViewUser.prompts.some((prompt) => prompt?.answer) && <div style={{ marginTop: "20px" }}><strong>Fitness prompts</strong><div style={{ display: "grid", gap: "10px", marginTop: "10px" }}>{profileViewUser.prompts.filter((prompt) => prompt?.answer).map((prompt, index) => <div key={`${prompt.question}-${index}`} style={{ padding: "13px 15px", borderRadius: "14px", background: "rgba(53,211,107,0.08)", border: "1px solid rgba(53,211,107,0.15)" }}><div style={{ fontSize: "12px", opacity: 0.65 }}>{prompt.question}</div><div style={{ marginTop: "5px", lineHeight: 1.5 }}>{prompt.answer}</div></div>)}</div></div>}
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "24px", paddingTop: "18px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <button type="button" className="button button-primary" onClick={() => handleConnect(profileViewUser)} disabled={safetyBusy}>💚 Connect</button>
                <button type="button" className="button button-connected" onClick={() => setShowReportModal((value) => !value)} disabled={safetyBusy}>⚑ Report</button>
                <button type="button" className="button button-connected" onClick={handleBlockUser} disabled={safetyBusy}>🚫 Block</button>
              </div>
              {showReportModal && <div style={{ marginTop: "16px", padding: "16px", borderRadius: "16px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}><strong>Report this profile</strong><label style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "12px", fontSize: "13px" }}>Reason<select value={reportReason} onChange={(event) => setReportReason(event.target.value)}><option>Spam or fake profile</option><option>Harassment or bullying</option><option>Inappropriate content</option><option>Unsafe behaviour</option><option>Other</option></select></label><label style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "12px", fontSize: "13px" }}>Details (optional)<textarea value={reportDetails} onChange={(event) => setReportDetails(event.target.value)} maxLength={1000} rows="3" placeholder="Tell us what happened..." /></label><div style={{ display: "flex", gap: "8px", marginTop: "12px" }}><button type="button" className="button button-primary" onClick={handleReportUser} disabled={safetyBusy}>{safetyBusy ? "Submitting..." : "Submit report"}</button><button type="button" className="button button-connected" onClick={() => setShowReportModal(false)} disabled={safetyBusy}>Cancel</button></div></div>}
            </div>
          </div>
        )}

        <section className="final-cta">



          <div className="final-cta-content">



            <span className="section-kicker">



              YOUR NEXT CHAPTER STARTS HERE



            </span>



            <h2>



              Less scrolling.



              <br />



              <span>More moving.</span>



            </h2>



            <p>Find your activity. Find your people. Make it happen.</p>



            <button



              className="button button-dark"



              onClick={() => openAuthOrScroll("discover")}



            >



              Find your fit <span>↗</span>



            </button>



          </div>



          <div className="cta-decoration">T.</div>



        </section>



      </main>







      <footer className="footer">



        <a className="brand footer-brand" href="#home">



          <span className="brand-icon">T</span>



          <span>



            try<span className="brand-highlight">fit</span>



          </span>



          <span className="brand-dot">.</span>



        </a>



        <p>Move together. Feel better.</p>



        <span>© 2026 TryFit · Demo prototype</span>



      </footer>







      {notice && (



        <div className="toast" role="status">



          <span>✓</span>



          {notice}



          <button



            aria-label="Dismiss notification"



            onClick={() => setNotice("")}



          >



            ×



          </button>



        </div>



      )}



    </div>



  );



}







export default App;