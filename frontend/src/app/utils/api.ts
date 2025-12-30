const API_BASE_URL = "http://localhost:8000";

// Add type definitions
interface AssignmentFilters {
  status?: string;
  course_code?: string;
  priority?: string;
}

interface AssignmentData {
  title: string;
  description?: string;
  course_code: string;
  due_date: string;
  priority: "low" | "medium" | "high";
  estimated_hours?: number;
  status?: string;
}

interface TimeSlot {
  day: string;
  start_time: string;
  end_time: string;
  location: string;
  type: string;
}

// Get auth token from localStorage
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

// Generic API request handler
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();

  const config: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || `HTTP error! status: ${response.status}`
    );
  }

  return response.json();
}

// Assignment API methods
export const assignmentApi = {
  getAll: async (filters?: AssignmentFilters) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status_filter", filters.status);
    if (filters?.course_code) params.append("course_code", filters.course_code);
    if (filters?.priority) params.append("priority", filters.priority);

    const queryString = params.toString();
    return apiRequest(`/assignments${queryString ? `?${queryString}` : ""}`);
  },

  getById: async (id: string) => {
    return apiRequest(`/assignments/${id}`);
  },

  create: async (data: AssignmentData) => {
    return apiRequest("/assignments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<AssignmentData>) => {
    return apiRequest(`/assignments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/assignments/${id}`, {
      method: "DELETE",
    });
  },

  getStats: async () => {
    return apiRequest("/assignments/summary/stats");
  },
};

// User API methods
export const userApi = {
  getCourses: async () => {
    return apiRequest("/user/courses");
  },

  enrollCourse: async (courseCode: string) => {
    return apiRequest(`/user/enroll/${courseCode}`, {
      method: "POST",
    });
  },

  unenrollCourse: async (courseCode: string) => {
    return apiRequest(`/user/unenroll/${courseCode}`, {
      method: "DELETE",
    });
  },

  getCurrentUser: async () => {
    return apiRequest("/auth/me");
  },
};

// Schedule API methods
export const scheduleApi = {
  getSchedule: async () => {
    return apiRequest("/schedule");
  },

  checkConflicts: async () => {
    return apiRequest("/schedule/conflicts");
  },

  addTimeSlot: async (courseCode: string, timeSlot: TimeSlot) => {
    return apiRequest(`/schedule/${courseCode}/slot`, {
      method: "POST",
      body: JSON.stringify(timeSlot),
    });
  },

  removeTimeSlot: async (
    courseCode: string,
    day: string,
    startTime: string
  ) => {
    return apiRequest(
      `/schedule/${courseCode}/slot?day=${day}&start_time=${startTime}`,
      {
        method: "DELETE",
      }
    );
  },
};

// Course API methods
export const courseApi = {
  getAll: async (limit: number = 100) => {
    return apiRequest(`/courses/all?limit=${limit}`);
  },

  searchCourses: async (
    query?: string,
    subject?: string,
    limit: number = 100
  ) => {
    const params = new URLSearchParams();
    if (query) params.append("q", query);
    if (subject) params.append("subject", subject);
    params.append("limit", limit.toString());

    return apiRequest(`/courses/search?${params.toString()}`);
  },

  getSubjects: async () => {
    return apiRequest("/courses/subjects");
  },

  getBySubject: async (subject: string, limit: number = 50) => {
    return apiRequest(`/courses/subject/${subject}?limit=${limit}`);
  },
};
