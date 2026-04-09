// ============================================
// Centralized API Client for Neon Auth Backend
// Replaces all Supabase client calls
// ============================================

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// ============================================
// TOKEN MANAGEMENT
// ============================================
const TOKEN_KEY = "civic_auth_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// ============================================
// BASE FETCH WRAPPER
// ============================================
async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
  const token = getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const json = await res.json();

    if (!res.ok) {
      return { data: null, error: json.error || `Request failed (${res.status})` };
    }

    return { data: json, error: null };
  } catch (err: any) {
    console.error(`API Error [${endpoint}]:`, err);
    return { data: null, error: err.message || "Network error" };
  }
}

// ============================================
// AUTH API
// ============================================
export const authApi = {
  async signup(userData: {
    email: string;
    password: string;
    fullName?: string;
    phone?: string;
    address?: string;
    aadhaar?: string;
    role?: string;
  }) {
    const result = await apiFetch<{ user: any; token: string }>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(userData),
    });

    if (result.data?.token) {
      setToken(result.data.token);
    }

    return result;
  },

  async login(email: string, password: string) {
    const result = await apiFetch<{ user: any; profile: any; token: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (result.data?.token) {
      setToken(result.data.token);
    }

    return result;
  },

  async me() {
    return apiFetch<{ user: any; profile: any }>("/api/auth/me");
  },

  logout() {
    removeToken();
  },
};

// ============================================
// PROFILES API
// ============================================
export const profilesApi = {
  async get(userId: string) {
    return apiFetch<any>(`/api/profiles/${userId}`);
  },

  async update(userId: string, data: { name?: string; bio?: string; notifications?: boolean; profile_photo?: string }) {
    return apiFetch<any>(`/api/profiles/${userId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
};

// ============================================
// ISSUES API
// ============================================
export const issuesApi = {
  async list() {
    return apiFetch<any[]>("/api/issues");
  },

  async create(data: { title: string; description?: string; category: string; location: string; priority?: string }) {
    return apiFetch<any>("/api/issues", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async leaderboard() {
    return apiFetch<{ id: string; name: string; count: number }[]>("/api/issues/leaderboard");
  },
};

// ============================================
// REWARDS API
// ============================================
export const rewardsApi = {
  async getMonthly(userId: string) {
    return apiFetch<{ issue_count: number; tokens_claimed: boolean }>(`/api/rewards/${userId}`);
  },

  async claim(userId: string, walletAddress: string) {
    return apiFetch<{ success: boolean }>(`/api/rewards/${userId}/claim`, {
      method: "POST",
      body: JSON.stringify({ walletAddress }),
    });
  },
};
