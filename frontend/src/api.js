const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.detail || `Request failed with status ${response.status}`
    );
  }

  return data;
}

export const api = {
  // =========================
  // ACTIVITIES
  // =========================

  getActivities() {
    return request("/activities/");
  },

  // =========================
  // USERS
  // =========================

  getUsers() {
    return request("/users/");
  },

  getUser(userId) {
    return request(`/users/${encodeURIComponent(userId)}`);
  },

  createUser(userData) {
    return request("/users/", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  updateUser(userId, userData) {
    return request(`/users/${encodeURIComponent(userId)}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  },

  // =========================
  // GOOGLE LOGIN
  // =========================

  googleLogin(credential) {
    return request("/auth/google", {
      method: "POST",
      body: JSON.stringify({
        credential,
      }),
    });
  },

  // =========================
  // COMMUNITY GAMES
  // =========================

  getGames() {
    return request("/games/");
  },

  createGame(gameData) {
    return request("/games/", {
      method: "POST",
      body: JSON.stringify(gameData),
    });
  },

  joinGame(gameId) {
    return request(`/games/${encodeURIComponent(gameId)}/join`, {
      method: "POST",
    });
  },

  leaveGame(gameId) {
    return request(`/games/${encodeURIComponent(gameId)}/leave`, {
      method: "POST",
    });
  },

  // =========================
  // CONNECTIONS
  // =========================

  createConnection(senderId, receiverId) {
    return request("/connections/", {
      method: "POST",
      body: JSON.stringify({
        sender_id: senderId,
        receiver_id: receiverId,
      }),
    });
  },

  getConnections() {
    return request("/connections/");
  },

  acceptConnection(connectionId, userId) {
    return request(
      `/connections/${encodeURIComponent(
        connectionId
      )}/accept?user_id=${encodeURIComponent(userId)}`,
      {
        method: "POST",
      }
    );
  },

  rejectConnection(connectionId, userId) {
    return request(
      `/connections/${encodeURIComponent(
        connectionId
      )}/reject?user_id=${encodeURIComponent(userId)}`,
      {
        method: "POST",
      }
    );
  },

  // =========================
  // CHAT / MESSAGES
  // =========================

  getMessages(userId, partnerId) {
    return request(
      `/messages/${encodeURIComponent(
        partnerId
      )}?user_id=${encodeURIComponent(userId)}`
    );
  },

  sendMessage(senderId, receiverId, text) {
    return request("/messages/", {
      method: "POST",
      body: JSON.stringify({
        sender_id: senderId,
        receiver_id: receiverId,
        text,
      }),
    });
  },

  // =========================
  // SAFETY
  // =========================

  getBlockedUsers(userId) {
    return request(
      `/safety/blocked?user_id=${encodeURIComponent(userId)}`
    );
  },

  reportUser(reporterId, reportedUserId, reason, details = "") {
    return request("/safety/report", {
      method: "POST",
      body: JSON.stringify({
        reporter_id: reporterId,
        reported_user_id: reportedUserId,
        reason,
        details,
      }),
    });
  },

  blockUser(blockerId, blockedUserId) {
    return request("/safety/block", {
      method: "POST",
      body: JSON.stringify({
        blocker_id: blockerId,
        blocked_user_id: blockedUserId,
      }),
    });
  },
};