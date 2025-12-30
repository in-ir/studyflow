/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Home,
  BookOpen,
  Calendar,
  FileText,
  Bot,
  User,
  LogOut,
  Settings,
  X,
  Plus,
  Search,
  Filter,
  Clock,
  AlertCircle,
  CheckCircle,
  Paperclip,
  Send,
  Menu,
  GraduationCap,
  Award,
  TrendingUp,
  Target,
  ChevronRight,
  BarChart3,
  Zap,
  BookMarked,
  Edit3,
  Trash2,
  CheckSquare,
  Square,
  MapPin,
} from "lucide-react";

// Define interfaces
interface Course {
  code: string;
  name: string;
  semester: string;
  color: string;
  title?: string;
  // REMOVED: professor field
}

interface APICourse {
  code: string;
  title: string;
  subject: string;
  number?: string;
  credits: number;
  description: string;
  prerequisites?: string;
  term?: string;
  // REMOVED: professor field
  status?: string;
}

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
  file?: {
    name: string;
    type: string;
    size: number;
  };
}

interface User {
  id: string;
  email: string;
  full_name: string;
  student_id?: string;
  enrolled_courses: string[];
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  course_code: string;
  due_date: string;
  priority: "low" | "medium" | "high";
  status: "todo" | "in_progress" | "completed" | "overdue";
  created_at: string;
  days_until_due: number;
  is_overdue: boolean;
  estimated_hours?: number;
}

interface TimeSlot {
  day: string;
  start_time: string;
  end_time: string;
  location: string;
  type: string;
}

interface ScheduleCourse {
  course_code: string;
  course_title: string;
  color: string;
  time_slots: TimeSlot[];
  is_personal: boolean;
}

// Helper functions
function getCourseColorClass(color: string): string {
  const colorMap: Record<string, string> = {
    red: "from-red-500/20 to-red-600/20 border-red-500/30",
    purple: "from-purple-500/20 to-purple-600/20 border-purple-500/30",
    blue: "from-blue-500/20 to-blue-600/20 border-blue-500/30",
    yellow: "from-yellow-500/20 to-orange-500/20 border-yellow-500/30",
    green: "from-green-500/20 to-emerald-600/20 border-green-500/30",
    orange: "from-orange-500/20 to-red-500/20 border-orange-500/30",
    pink: "from-pink-500/20 to-rose-600/20 border-pink-500/30",
    indigo: "from-indigo-500/20 to-purple-600/20 border-indigo-500/30",
    gray: "from-gray-500/20 to-gray-600/20 border-gray-500/30",
  };
  return (
    colorMap[color] || "from-gray-500/20 to-gray-600/20 border-gray-500/30"
  );
}

function getRandomColor(): string {
  const colors = [
    "red",
    "purple",
    "blue",
    "yellow",
    "green",
    "gray",
    "orange",
    "pink",
    "indigo",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function convertToCourse(apiCourse: APICourse): Course {
  return {
    code: apiCourse.code,
    name: apiCourse.title,
    title: apiCourse.title,
    semester: "Fall 2025",
    color: getRandomColor(),
    // REMOVED: professor field
  };
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [showProfile, setShowProfile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const storedToken = localStorage.getItem("auth_token");
      const storedUser = localStorage.getItem("auth_user");

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);
          setAuthChecked(true);
        } catch (error) {
          console.error("Error parsing stored user data:", error);
          localStorage.removeItem("auth_token");
          localStorage.removeItem("auth_user");
          window.location.href = "/auth";
        }
      } else {
        window.location.href = "/auth";
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (!user || !token) return;

    const loadEnrolledCourses = async () => {
      try {
        const response = await fetch("http://localhost:8000/user/courses", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setEnrolledCourses(data.enrolled_courses || []);
          setLoading(false);
          return;
        } else if (response.status === 401) {
          handleLogout();
          return;
        }
      } catch (apiError) {
        console.log("Backend not available, using local storage");
      }

      const savedCourses = localStorage.getItem("enrolledCourses");
      if (savedCourses) {
        setEnrolledCourses(JSON.parse(savedCourses));
      } else {
        setEnrolledCourses([]);
      }
      setLoading(false);
    };

    loadEnrolledCourses();
  }, [user, token]);

  useEffect(() => {
    if (!loading && authChecked) {
      localStorage.setItem("enrolledCourses", JSON.stringify(enrolledCourses));
    }
  }, [enrolledCourses, loading, authChecked]);

  const handleLogout = async () => {
    try {
      if (token) {
        await fetch("http://localhost:8000/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      }
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      localStorage.removeItem("enrolledCourses");
      window.location.href = "/auth";
    }
  };

  const enrollInCourse = async (apiCourse: APICourse) => {
    if (!token) {
      alert("Please login to enroll in courses");
      return;
    }

    try {
      const isAlreadyEnrolled = enrolledCourses.some(
        (course) => course.code === apiCourse.code
      );

      if (isAlreadyEnrolled) {
        alert("You are already enrolled in this course!");
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:8000/user/enroll/${apiCourse.code}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          console.log("Successfully enrolled via backend");
        } else if (response.status === 401) {
          handleLogout();
          return;
        }
      } catch (apiError) {
        console.log("Backend enrollment failed, using local storage only");
      }

      const newCourse = convertToCourse(apiCourse);
      setEnrolledCourses((prev) => [...prev, newCourse]);
      alert(
        `Successfully enrolled in ${apiCourse.code}! Add your schedule manually in the Schedule page.`
      );
    } catch (error) {
      console.error("Error enrolling in course:", error);
      alert("Failed to enroll in course. Please try again.");
    }
  };

  const unenrollFromCourse = async (courseCode: string) => {
    if (!token) return;

    if (confirm(`Are you sure you want to unenroll from ${courseCode}?`)) {
      try {
        const response = await fetch(
          `http://localhost:8000/user/unenroll/${courseCode}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.status === 401) {
          handleLogout();
          return;
        }
      } catch (apiError) {
        console.log("Backend unenroll failed");
      }

      setEnrolledCourses((prev) =>
        prev.filter((course) => course.code !== courseCode)
      );
      alert(`Successfully unenrolled from ${courseCode}!`);
    }
  };

  if (!authChecked || loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-serif">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/50 mx-auto mb-4"></div>
          <p className="text-lg text-gray-400">
            {!authChecked
              ? "Checking authentication..."
              : "Loading your courses..."}
          </p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case "courses":
        return (
          <CourseSelectionPage
            onEnroll={enrollInCourse}
            enrolledCourses={enrolledCourses}
            token={token}
          />
        );
      case "schedule":
        return <SchedulePage token={token} enrolledCourses={enrolledCourses} />;
      case "assignments":
        return (
          <AssignmentsPage token={token} enrolledCourses={enrolledCourses} />
        );
      case "ai-assistant":
        return <AIAssistantPage />;
      default:
        return (
          <DashboardPage
            courses={enrolledCourses}
            error={error}
            onUnenroll={unenrollFromCourse}
            user={user}
            onNavigateToCourses={() => setCurrentPage("courses")}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-serif">
      {/* Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 hover:bg-white/5 rounded-lg transition-all"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
                <GraduationCap size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight">
                  StudyFlow
                </h1>
                <p className="text-[10px] text-gray-500">
                  Smart Learning Platform
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-3 bg-white/5 hover:bg-white/10 px-4 py-2.5 rounded-lg transition-all border border-white/10"
            >
              <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-sm font-medium border border-white/20">
                {user?.full_name?.[0] || "U"}
              </div>
              <span className="text-sm font-medium">
                {user?.full_name?.split(" ")[0] || "User"}
              </span>
            </button>

            {showProfile && (
              <div className="absolute right-0 mt-2 w-72 bg-zinc-900/95 border border-white/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl">
                <div className="p-6 border-b border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-lg font-medium border border-white/20">
                      {user?.full_name?.[0] || "U"}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-base">
                        {user?.full_name}
                      </p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                  </div>
                  {user?.student_id && (
                    <div className="text-xs text-gray-500 bg-white/5 rounded px-2 py-1 inline-block">
                      ID: {user.student_id}
                    </div>
                  )}
                </div>
                <div className="py-2">
                  <button className="w-full text-left px-6 py-3 hover:bg-white/5 transition-colors flex items-center gap-3 text-sm">
                    <Settings size={16} className="text-gray-400" />
                    <span>Settings</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-6 py-3 hover:bg-white/5 transition-colors text-red-400 flex items-center gap-3 text-sm"
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Slide-out Menu */}
      <div
        className={`fixed inset-0 z-40 transition-all duration-300 ${
          menuOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
            menuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setMenuOpen(false)}
        ></div>

        <div
          className={`absolute top-0 left-0 h-full w-80 bg-zinc-900/95 backdrop-blur-xl border-r border-white/10 shadow-2xl transform transition-transform duration-300 overflow-y-auto ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="p-8 pt-24">
            <h2 className="text-xl font-semibold mb-8 text-gray-300">
              Navigation
            </h2>

            <nav className="space-y-2">
              {[
                { id: "dashboard", name: "Dashboard", icon: Home },
                { id: "courses", name: "Browse Courses", icon: BookOpen },
                { id: "schedule", name: "Schedule", icon: Calendar },
                { id: "assignments", name: "Assignments", icon: FileText },
                { id: "ai-assistant", name: "AI Assistant", icon: Bot },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentPage(item.id);
                      setMenuOpen(false);
                    }}
                    className={`w-full text-left px-5 py-3.5 rounded-lg flex items-center gap-3 transition-all text-sm ${
                      currentPage === item.id
                        ? "bg-white/10 text-white border border-white/20"
                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon size={18} />
                    <span className="font-medium">{item.name}</span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-8 p-6 bg-white/5 rounded-xl border border-white/10 backdrop-blur-xl">
              <div className="text-xs text-gray-500 mb-4 font-medium uppercase tracking-wider">
                Your Progress
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-2xl font-semibold text-white">
                    {enrolledCourses.length}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Courses</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-white">-</div>
                  <div className="text-xs text-gray-500 mt-1">Complete</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-white">-</div>
                  <div className="text-xs text-gray-500 mt-1">Pending</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20">{renderPage()}</div>

      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Crimson+Pro:wght@300;400;500;600;700&display=swap");

        .font-serif {
          font-family: "Crimson Pro", "Georgia", serif;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}

// Dashboard Page Component
function DashboardPage({
  courses,
  error,
  onUnenroll,
  user,
  onNavigateToCourses,
}: {
  courses: Course[];
  error: string | null;
  onUnenroll: (courseCode: string) => void;
  user: User | null;
  onNavigateToCourses: () => void;
}) {
  const [typingText, setTypingText] = useState("");
  const [showFullText, setShowFullText] = useState(false);
  const fullText = "It's time to lock in.";

  useEffect(() => {
    if (showFullText) return;

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setTypingText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        setShowFullText(true);
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Hero Section */}
        <div className="mb-16">
          <h1 className="text-5xl font-semibold mb-3 tracking-tight">
            Good evening, {user?.full_name?.split(" ")[0] || "Student"}
          </h1>
          <p className="text-xl text-gray-400 h-8 flex items-start">
            {typingText}
            {!showFullText && <span className="animate-pulse ml-1">|</span>}
          </p>
          {error && (
            <p className="text-amber-400 text-sm mt-4 bg-amber-900/10 py-2 px-4 rounded-lg inline-block border border-amber-500/20">
              {error}
            </p>
          )}
        </div>

        {courses.length > 0 ? (
          <>
            <div className="mb-16">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-semibold">Your Courses</h2>
                <button
                  onClick={onNavigateToCourses}
                  className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                >
                  <span>View all</span>
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course, index) => (
                  <div
                    key={course.code}
                    className={`group relative rounded-xl p-6 transition-all hover:scale-[1.02] bg-gradient-to-br ${getCourseColorClass(
                      course.color
                    )} border backdrop-blur-xl`}
                    style={{
                      animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
                    }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-md text-xs font-medium border border-white/20">
                        {course.semester}
                      </div>
                      <button
                        onClick={() => onUnenroll(course.code)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 bg-red-500/80 hover:bg-red-500 rounded-md flex items-center justify-center"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <h3 className="text-xl font-semibold mb-2">
                      {course.code}
                    </h3>
                    <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                      {course.name || course.title}
                    </p>

                    {/* REMOVED: Professor info display */}
                  </div>
                ))}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white/5 rounded-xl p-8 border border-white/10 backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-8">
                  <Calendar size={22} className="text-gray-400" />
                  <h3 className="text-xl font-semibold">This Week</h3>
                </div>
                <div className="grid grid-cols-7 gap-3">
                  {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                    <div key={i} className="text-center">
                      <div className="text-gray-500 text-xs font-medium mb-3">
                        {day}
                      </div>
                      <div
                        className={`w-full aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all cursor-pointer ${
                          i === 3
                            ? "bg-white/20 text-white border border-white/30"
                            : "bg-white/5 hover:bg-white/10 text-gray-400"
                        }`}
                      >
                        {i + 1}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-white/10">
                  <div className="flex items-center gap-3 bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-all border border-white/10">
                    <Clock size={16} className="text-gray-400" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        Schedule Your Classes
                      </div>
                      <div className="text-gray-500 text-xs mt-0.5">
                        Add your timetable in the Schedule page
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-8 border border-white/10 backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-8">
                  <Target size={22} className="text-gray-400" />
                  <h3 className="text-xl font-semibold">Tasks</h3>
                </div>
                <div className="text-center py-12">
                  <FileText size={32} className="mx-auto mb-3 text-gray-600" />
                  <p className="text-gray-500 text-sm">
                    No assignments yet. Create your first task!
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-32">
            <div className="w-20 h-20 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-6 border border-white/20">
              <BookOpen size={36} className="text-gray-400" />
            </div>
            <h2 className="text-3xl font-semibold mb-4">No Courses Yet</h2>
            <p className="text-gray-400 mb-10 max-w-md mx-auto text-lg">
              Start your academic journey by browsing and enrolling in courses
              that interest you.
            </p>
            <button
              onClick={onNavigateToCourses}
              className="bg-white/10 hover:bg-white/20 px-8 py-3.5 rounded-lg font-medium transition-all border border-white/20 inline-flex items-center gap-2"
            >
              <BookOpen size={18} />
              <span>Browse Courses</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Course Selection Page
function CourseSelectionPage({
  onEnroll,
  enrolledCourses,
  token,
}: {
  onEnroll: (course: APICourse) => void;
  enrolledCourses: Course[];
  token: string | null;
}) {
  const [availableCourses, setAvailableCourses] = useState<APICourse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<APICourse | null>(null);

  const isEnrolled = (courseCode: string): boolean => {
    return enrolledCourses.some((course) => course.code === courseCode);
  };

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const response = await fetch("http://localhost:8000/courses/subjects");
        if (response.ok) {
          const data = await response.json();
          setSubjects(data.subjects || []);
        }
      } catch (error) {
        console.error("Error loading subjects:", error);
      }
    };
    loadSubjects();
  }, []);

  useEffect(() => {
    const loadInitialCourses = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/courses/all?limit=50"
        );
        if (response.ok) {
          const data = await response.json();
          setAvailableCourses(data.courses || []);
        }
      } catch (error) {
        console.error("Error loading courses:", error);
      } finally {
        setLoading(false);
      }
    };
    loadInitialCourses();
  }, []);

  const performSearch = async () => {
    if (!searchTerm.trim() && !selectedSubject) {
      try {
        const response = await fetch(
          "http://localhost:8000/courses/all?limit=100"
        );
        if (response.ok) {
          const data = await response.json();
          setAvailableCourses(data.courses || []);
        }
      } catch (error) {
        console.error("Error loading courses:", error);
      }
      return;
    }

    setSearchLoading(true);
    try {
      let searchUrl = "";
      if (selectedSubject && !searchTerm.trim()) {
        searchUrl = `http://localhost:8000/courses/subject/${selectedSubject}`;
      } else if (searchTerm.trim()) {
        const params = new URLSearchParams();
        params.append("q", searchTerm.trim());
        if (selectedSubject) params.append("subject", selectedSubject);
        params.append("limit", "100");
        searchUrl = `http://localhost:8000/courses/search?${params.toString()}`;
      }

      if (searchUrl) {
        const response = await fetch(searchUrl);
        if (response.ok) {
          const data = await response.json();
          setAvailableCourses(data.courses || []);
        }
      }
    } catch (error) {
      console.error("Error searching courses:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedSubject]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-white/20 border-t-white/50 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading course catalog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-4xl font-semibold mb-3 tracking-tight">
                Browse Courses
              </h1>
              <p className="text-gray-400 text-lg">
                Explore over 4,000 courses • Currently enrolled in{" "}
                <span className="text-white font-medium">
                  {enrolledCourses.length}
                </span>{" "}
                courses
              </p>
            </div>
            <div className="bg-white/10 rounded-xl px-6 py-4 text-center border border-white/20">
              <div className="text-3xl font-semibold">
                {availableCourses.length}
              </div>
              <div className="text-xs text-gray-500 mt-1">Results</div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10 backdrop-blur-xl">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search by course name or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-6 py-3.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-all"
                />
                {searchLoading && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white/50 rounded-full animate-spin"></div>
                  </div>
                )}
              </div>

              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-5 py-3.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30 transition-all min-w-[200px]"
              >
                <option value="">All Subjects</option>
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>

              {(searchTerm || selectedSubject) && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedSubject("");
                  }}
                  className="px-5 py-3.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-all text-red-400 font-medium"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Course Cards Grid */}
        {availableCourses.length === 0 ? (
          <div className="text-center py-32 bg-white/5 rounded-xl border border-white/10">
            <Search size={48} className="mx-auto mb-6 text-gray-500" />
            <h2 className="text-2xl font-semibold mb-3">No Courses Found</h2>
            <p className="text-gray-400 mb-8">
              Try adjusting your search filters
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedSubject("");
              }}
              className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-lg transition-all font-medium border border-white/20"
            >
              Show All Courses
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableCourses.map((course, index) => {
              const enrolled = isEnrolled(course.code);

              return (
                <div
                  key={`${course.code}-${index}`}
                  className={`group rounded-xl p-6 transition-all hover:scale-[1.02] cursor-pointer border backdrop-blur-xl ${
                    enrolled
                      ? "bg-green-500/10 border-green-500/30"
                      : "bg-white/5 border-white/10 hover:border-white/30"
                  }`}
                  onClick={() => setSelectedCourse(course)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-white/10 text-white px-3 py-1 rounded-md text-xs font-medium border border-white/20">
                      {course.subject}
                    </div>
                    {enrolled && (
                      <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 border border-green-500/30">
                        <CheckCircle size={12} />
                        Enrolled
                      </div>
                    )}
                  </div>

                  <h3 className="text-xl font-semibold mb-2">{course.code}</h3>
                  <p className="text-gray-300 font-medium mb-3 line-clamp-2 min-h-[3rem] text-sm">
                    {course.title}
                  </p>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-3 min-h-[4rem]">
                    {course.description || "No description available"}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1.5">
                      <BookMarked size={14} />
                      {course.credits || 3} credits
                    </span>
                  </div>

                  {enrolled ? (
                    <button
                      disabled
                      className="w-full py-3 bg-green-500/20 rounded-lg font-medium text-green-400 cursor-not-allowed border border-green-500/30"
                    >
                      Already Enrolled
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEnroll(course);
                      }}
                      className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-all border border-white/20"
                    >
                      Add Course
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Course Details Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-xl p-8 max-w-2xl w-full border border-white/10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="bg-white/10 text-white px-3 py-1 rounded-md text-xs font-medium inline-block mb-3 border border-white/20">
                  {selectedCourse.subject}
                </div>
                <h2 className="text-3xl font-semibold mb-2">
                  {selectedCourse.code}
                </h2>
                <h3 className="text-xl text-gray-400">
                  {selectedCourse.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCourse(null)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="text-sm text-gray-500 mb-1">Credits</div>
                  <div className="text-2xl font-semibold">
                    {selectedCourse.credits || 3}
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="text-sm text-gray-500 mb-1">Subject</div>
                  <div className="text-2xl font-semibold">
                    {selectedCourse.subject}
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <h4 className="font-semibold mb-3 text-gray-300">
                  Course Description
                </h4>
                <p className="text-gray-400 leading-relaxed">
                  {selectedCourse.description ||
                    "No description available for this course."}
                </p>
              </div>

              {selectedCourse.prerequisites && (
                <div className="bg-amber-900/10 border border-amber-500/30 rounded-lg p-6">
                  <h4 className="font-semibold text-amber-400 mb-3 flex items-center gap-2">
                    <AlertCircle size={18} />
                    Prerequisites
                  </h4>
                  <p className="text-gray-400">
                    {selectedCourse.prerequisites}
                  </p>
                </div>
              )}

              <div className="flex gap-4">
                {isEnrolled(selectedCourse.code) ? (
                  <button
                    disabled
                    className="flex-1 py-3.5 bg-green-500/20 rounded-lg font-semibold text-green-400 cursor-not-allowed border border-green-500/30"
                  >
                    Already Enrolled
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onEnroll(selectedCourse);
                      setSelectedCourse(null);
                    }}
                    className="flex-1 py-3.5 bg-white/10 hover:bg-white/20 rounded-lg font-semibold transition-all border border-white/20"
                  >
                    Enroll in This Course
                  </button>
                )}
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="px-8 py-3.5 bg-white/5 hover:bg-white/10 rounded-lg font-medium transition-all border border-white/10"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Schedule Page - NOW WITH MANUAL ENTRY FORM
function SchedulePage({
  token,
  enrolledCourses,
}: {
  token: string | null;
  enrolledCourses: Course[];
}) {
  const [schedule, setSchedule] = useState<ScheduleCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalHours, setTotalHours] = useState(0);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"week" | "list">("week");
  const [showAddForm, setShowAddForm] = useState(false);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const timeSlots = Array.from({ length: 25 }, (_, i) => {
    const hour = Math.floor(8 + i / 2);
    const minute = i % 2 === 0 ? "00" : "30";
    return `${hour.toString().padStart(2, "0")}:${minute}`;
  });

  useEffect(() => {
    if (token) {
      loadSchedule();
      checkConflicts();
    }
  }, [token]);

  const loadSchedule = async () => {
    try {
      const response = await fetch("http://localhost:8000/schedule", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSchedule(data.schedule || []);
        setTotalHours(data.total_hours_per_week || 0);
      }
    } catch (error) {
      console.error("Error loading schedule:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkConflicts = async () => {
    try {
      const response = await fetch("http://localhost:8000/schedule/conflicts", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConflicts(data.conflicts || []);
      }
    } catch (error) {
      console.error("Error checking conflicts:", error);
    }
  };

  const getCourseColorClass = (color: string): string => {
    const colorMap: Record<string, string> = {
      red: "from-red-500/80 to-red-600/80",
      purple: "from-purple-500/80 to-purple-600/80",
      blue: "from-blue-500/80 to-blue-600/80",
      yellow: "from-yellow-500/80 to-orange-500/80",
      green: "from-green-500/80 to-emerald-600/80",
      orange: "from-orange-500/80 to-red-500/80",
      pink: "from-pink-500/80 to-rose-600/80",
      indigo: "from-indigo-500/80 to-purple-600/80",
      gray: "from-gray-500/80 to-gray-600/80",
    };
    return colorMap[color] || "from-gray-500/80 to-gray-600/80";
  };

  const getSlotPosition = (startTime: string, endTime: string) => {
    const parseTime = (time: string) => {
      const [hours, minutes] = time.split(":").map(Number);
      return hours * 60 + minutes;
    };

    const startMinutes = parseTime(startTime);
    const endMinutes = parseTime(endTime);
    const duration = endMinutes - startMinutes;

    const baseMinutes = 8 * 60;
    const top = ((startMinutes - baseMinutes) / 30) * 60;
    const height = (duration / 30) * 60;

    return { top, height };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-white/20 border-t-white/50 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-4xl font-semibold mb-3 tracking-tight">
                Weekly Schedule
              </h1>
              <p className="text-gray-400 text-lg">
                Your personalized timetable
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddForm(true)}
                className="px-5 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-all border border-white/20 flex items-center gap-2"
              >
                <Plus size={18} />
                Add to Schedule
              </button>
              <button
                onClick={() => setViewMode("week")}
                className={`px-5 py-3 rounded-lg font-medium transition-all border ${
                  viewMode === "week"
                    ? "bg-white/10 text-white border-white/20"
                    : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
                }`}
              >
                Week View
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-5 py-3 rounded-lg font-medium transition-all border ${
                  viewMode === "list"
                    ? "bg-white/10 text-white border-white/20"
                    : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
                }`}
              >
                List View
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <BookOpen size={20} className="text-gray-400" />
                <span className="text-sm text-gray-500 font-medium">
                  Items Scheduled
                </span>
              </div>
              <div className="text-3xl font-semibold">{schedule.length}</div>
            </div>
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <Clock size={20} className="text-gray-400" />
                <span className="text-sm text-gray-500 font-medium">
                  Weekly Hours
                </span>
              </div>
              <div className="text-3xl font-semibold">{totalHours}h</div>
            </div>
            <div
              className={`rounded-xl p-6 border ${
                conflicts.length > 0
                  ? "bg-red-500/10 border-red-500/30"
                  : "bg-white/5 border-white/10"
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                {conflicts.length > 0 ? (
                  <AlertCircle size={20} className="text-red-400" />
                ) : (
                  <CheckCircle size={20} className="text-gray-400" />
                )}
                <span className="text-sm text-gray-500 font-medium">
                  Time Conflicts
                </span>
              </div>
              <div
                className={`text-3xl font-semibold ${
                  conflicts.length > 0 ? "text-red-400" : ""
                }`}
              >
                {conflicts.length}
              </div>
            </div>
          </div>

          {/* Conflicts Alert */}
          {conflicts.length > 0 && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 mb-8 backdrop-blur-xl">
              <div className="flex items-start gap-4">
                <AlertCircle size={24} className="text-red-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-400 text-lg mb-3">
                    Schedule Conflicts Detected
                  </h3>
                  <div className="space-y-2">
                    {conflicts.map((conflict, index) => (
                      <div key={index} className="text-sm text-gray-400">
                        <span className="font-medium text-white">
                          {conflict.course1}
                        </span>{" "}
                        and{" "}
                        <span className="font-medium text-white">
                          {conflict.course2}
                        </span>{" "}
                        overlap on{" "}
                        <span className="text-red-400">{conflict.day}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        {schedule.length === 0 ? (
          <div className="text-center py-32 bg-white/5 rounded-xl border border-white/10">
            <Calendar size={48} className="mx-auto mb-6 text-gray-500" />
            <h2 className="text-2xl font-semibold mb-3">No Schedule Yet</h2>
            <p className="text-gray-400 mb-8">
              Add your class times and personal events to build your schedule!
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-lg transition-all font-medium border border-white/20 inline-flex items-center gap-2"
            >
              <Plus size={18} />
              Add to Schedule
            </button>
          </div>
        ) : viewMode === "week" ? (
          // Week View - Same as before
          <div className="bg-white/5 rounded-xl overflow-hidden border border-white/10">
            {/* Calendar Header */}
            <div className="grid grid-cols-6 bg-white/10 border-b border-white/10">
              <div className="p-4 font-semibold text-sm text-gray-400">
                Time
              </div>
              {days.map((day) => (
                <div
                  key={day}
                  className="p-4 font-semibold text-center text-sm border-l border-white/10"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Body */}
            <div className="relative">
              <div className="grid grid-cols-6">
                {/* Time Column */}
                <div className="border-r border-white/10">
                  {timeSlots.map((time) => (
                    <div
                      key={time}
                      className="h-[60px] p-2 text-xs text-gray-500 border-b border-white/10 flex items-center"
                    >
                      {time}
                    </div>
                  ))}
                </div>

                {/* Day Columns */}
                {days.map((day) => (
                  <div
                    key={day}
                    className="relative border-r border-white/10 last:border-r-0"
                  >
                    {timeSlots.map((time) => (
                      <div
                        key={time}
                        className="h-[60px] border-b border-white/10 hover:bg-white/5 transition-colors"
                      ></div>
                    ))}

                    {/* Course blocks */}
                    <div className="absolute top-0 left-0 right-0">
                      {schedule.map((course) =>
                        course.time_slots
                          .filter((slot: any) => slot.day === day)
                          .map((slot: any, index: number) => {
                            const { top, height } = getSlotPosition(
                              slot.start_time,
                              slot.end_time
                            );

                            return (
                              <div
                                key={`${course.course_code}-${index}`}
                                className={`absolute left-1 right-1 bg-gradient-to-br ${getCourseColorClass(
                                  course.color
                                )} rounded-lg p-3 cursor-pointer hover:scale-[1.02] transition-all border-l-2 border-white/50`}
                                style={{
                                  top: `${top}px`,
                                  height: `${height}px`,
                                  zIndex: 10,
                                }}
                                onClick={() =>
                                  setSelectedSlot({ course, slot })
                                }
                              >
                                <div className="text-white font-semibold text-xs truncate mb-1">
                                  {course.course_code}
                                </div>
                                <div className="text-white/90 text-xs truncate mb-1">
                                  {slot.type}
                                </div>
                                <div className="text-white/80 text-xs truncate flex items-center gap-1">
                                  <MapPin size={10} />
                                  {slot.location}
                                </div>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // List View
          <div className="space-y-6">
            {days.map((day) => {
              const daySlots = schedule
                .flatMap((course) =>
                  course.time_slots
                    .filter((slot: any) => slot.day === day)
                    .map((slot: any) => ({ course, slot }))
                )
                .sort((a, b) =>
                  a.slot.start_time.localeCompare(b.slot.start_time)
                );

              if (daySlots.length === 0) return null;

              return (
                <div
                  key={day}
                  className="bg-white/5 rounded-xl border border-white/10 overflow-hidden"
                >
                  <div className="bg-white/10 p-5 border-b border-white/10">
                    <h3 className="font-semibold text-lg">{day}</h3>
                  </div>
                  <div className="p-5 space-y-3">
                    {daySlots.map(({ course, slot }, index) => (
                      <div
                        key={index}
                        className={`bg-gradient-to-r ${getCourseColorClass(
                          course.color
                        )} rounded-lg p-5 cursor-pointer hover:scale-[1.01] transition-all`}
                        onClick={() => setSelectedSlot({ course, slot })}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="text-white font-semibold text-base mb-1">
                              {course.course_code}
                            </div>
                            <div className="text-white/90 text-sm mb-3">
                              {slot.type}
                            </div>
                            <div className="text-white/80 text-sm flex items-center gap-2">
                              <MapPin size={14} />
                              {slot.location}
                            </div>
                          </div>
                          <div className="text-white text-right">
                            <div className="font-semibold text-base">
                              {slot.start_time}
                            </div>
                            <div className="text-xs text-white/60 my-1">to</div>
                            <div className="font-semibold text-base">
                              {slot.end_time}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Course Legend */}
        {schedule.length > 0 && (
          <div className="mt-12 bg-white/5 rounded-xl p-8 border border-white/10">
            <h3 className="text-xl font-semibold mb-6">Course Legend</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {schedule.map((course) => (
                <div
                  key={course.course_code}
                  className="flex items-center gap-3 bg-white/5 rounded-lg p-3 border border-white/10"
                >
                  <div
                    className={`w-6 h-6 rounded-md bg-gradient-to-br ${getCourseColorClass(
                      course.color
                    )}`}
                  ></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">
                      {course.course_code}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {course.is_personal ? "Personal" : course.course_title}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Selected Slot Modal */}
      {selectedSlot && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-xl p-8 max-w-md w-full border border-white/10">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-semibold">
                {selectedSlot.course.course_code}
              </h3>
              <button
                onClick={() => setSelectedSlot(null)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="text-sm text-gray-500 mb-1">
                  {selectedSlot.course.is_personal
                    ? "Event Title"
                    : "Course Title"}
                </div>
                <div className="font-medium">
                  {selectedSlot.course.course_title}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="text-sm text-gray-500 mb-1">Type</div>
                  <div className="font-medium">{selectedSlot.slot.type}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="text-sm text-gray-500 mb-1">Day</div>
                  <div className="font-medium">{selectedSlot.slot.day}</div>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="text-sm text-gray-500 mb-1">Time</div>
                <div className="font-medium text-lg">
                  {selectedSlot.slot.start_time} - {selectedSlot.slot.end_time}
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="text-sm text-gray-500 mb-1">Location</div>
                <div className="font-medium flex items-center gap-2">
                  <MapPin size={16} />
                  {selectedSlot.slot.location}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedSlot(null)}
              className="mt-6 w-full bg-white/10 hover:bg-white/20 py-3 rounded-lg transition-all font-medium border border-white/20"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Add Schedule Form Modal */}
      {showAddForm && (
        <AddScheduleForm
          enrolledCourses={enrolledCourses}
          token={token}
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            loadSchedule();
            checkConflicts();
            setShowAddForm(false);
          }}
        />
      )}
    </div>
  );
}

// Add Schedule Form Component
function AddScheduleForm({
  enrolledCourses,
  token,
  onClose,
  onSuccess,
}: {
  enrolledCourses: Course[];
  token: string | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    is_personal: false,
    course_code: "",
    course_title: "",
    day: "",
    start_time: "",
    end_time: "",
    location: "",
    session_type: "Lecture",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.day ||
      !formData.start_time ||
      !formData.end_time ||
      !formData.location
    ) {
      setError("Please fill in all required fields");
      return;
    }

    if (!formData.is_personal && !formData.course_code) {
      setError("Please select a course or mark this as a personal event");
      return;
    }

    if (formData.is_personal && !formData.course_title) {
      setError("Please enter a title for your personal event");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8000/schedule/manual", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          course_code: formData.is_personal
            ? formData.course_title
            : formData.course_code,
          course_title: formData.is_personal
            ? formData.course_title
            : enrolledCourses.find((c) => c.code === formData.course_code)
                ?.title || formData.course_code,
          day: formData.day,
          start_time: formData.start_time,
          end_time: formData.end_time,
          location: formData.location,
          session_type: formData.session_type,
          is_personal: formData.is_personal,
        }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to add to schedule");
      }
    } catch (error) {
      setError("Network error. Please try again.");
      console.error("Error adding to schedule:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-xl p-8 max-w-2xl w-full border border-white/10 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Add to Schedule</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Event Type Toggle */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_personal}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    is_personal: e.target.checked,
                    course_code: "",
                  })
                }
                className="w-5 h-5 rounded border-white/20 bg-white/5"
              />
              <div>
                <div className="text-sm font-medium">Personal Event</div>
                <div className="text-xs text-gray-500">
                  Not related to any enrolled course
                </div>
              </div>
            </label>
          </div>

          {/* Course Selection OR Title Input */}
          {formData.is_personal ? (
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-400">
                Event Title *
              </label>
              <input
                type="text"
                value={formData.course_title}
                onChange={(e) =>
                  setFormData({ ...formData, course_title: e.target.value })
                }
                placeholder="e.g., Gym, Study Group, Work..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-all"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-400">
                Course *
              </label>
              <select
                value={formData.course_code}
                onChange={(e) =>
                  setFormData({ ...formData, course_code: e.target.value })
                }
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30 transition-all"
              >
                <option value="">Select a course...</option>
                {enrolledCourses.map((course) => (
                  <option key={course.code} value={course.code}>
                    {course.code} - {course.name || course.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Session Type */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-400">
              Type *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {["Lecture", "Lab", "Tutorial", "Other"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, session_type: type })
                  }
                  className={`px-4 py-3 rounded-lg font-medium transition-all border ${
                    formData.session_type === type
                      ? "bg-white/20 border-white/30 text-white"
                      : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Day Selection */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-400">
              Day *
            </label>
            <select
              value={formData.day}
              onChange={(e) =>
                setFormData({ ...formData, day: e.target.value })
              }
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30 transition-all"
            >
              <option value="">Select a day...</option>
              {[
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
              ].map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-400">
                Start Time *
              </label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) =>
                  setFormData({ ...formData, start_time: e.target.value })
                }
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-400">
                End Time *
              </label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) =>
                  setFormData({ ...formData, end_time: e.target.value })
                }
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30 transition-all"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-400">
              Location *
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder="e.g., SITE 1027, Online, Library..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-all"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-all border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Adding...
                </div>
              ) : (
                "Add to Schedule"
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-8 py-3 bg-white/5 hover:bg-white/10 rounded-lg font-medium transition-all border border-white/10 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Assignments Page
function AssignmentsPage({
  token,
  enrolledCourses,
}: {
  token: string | null;
  enrolledCourses: Course[];
}) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filter, setFilter] = useState({
    status: "",
    course: "",
    priority: "",
  });

  useEffect(() => {
    if (token) {
      loadAssignments();
      loadStats();
    }
  }, [token, filter]);

  const loadAssignments = async () => {
    try {
      const params = new URLSearchParams();
      if (filter.status) params.append("status_filter", filter.status);
      if (filter.course) params.append("course_code", filter.course);
      if (filter.priority) params.append("priority", filter.priority);

      const response = await fetch(
        `http://localhost:8000/assignments?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAssignments(data);
      }
    } catch (error) {
      console.error("Error loading assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(
        "http://localhost:8000/assignments/summary/stats",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const updateAssignmentStatus = async (
    assignmentId: string,
    newStatus: string
  ) => {
    try {
      const response = await fetch(
        `http://localhost:8000/assignments/${assignmentId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      if (response.ok) {
        loadAssignments();
        loadStats();
      }
    } catch (error) {
      console.error("Error updating assignment:", error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-red-500/30 bg-red-500/10 text-red-400";
      case "medium":
        return "border-yellow-500/30 bg-yellow-500/10 text-yellow-400";
      case "low":
        return "border-green-500/30 bg-green-500/10 text-green-400";
      default:
        return "border-gray-500/30 bg-gray-500/10 text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle size={20} className="text-green-400" />;
      case "in_progress":
        return <Clock size={20} className="text-yellow-400" />;
      case "overdue":
        return <AlertCircle size={20} className="text-red-400" />;
      case "todo":
        return <Square size={20} className="text-gray-400" />;
      default:
        return <Square size={20} className="text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-white/20 border-t-white/50 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-4xl font-semibold mb-3 tracking-tight">
                Assignments
              </h1>
              <p className="text-gray-400 text-lg">
                Track your coursework and stay on top of deadlines
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-lg transition-all font-medium border border-white/20 inline-flex items-center gap-2"
            >
              <Plus size={18} />
              New Assignment
            </button>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
              {[
                {
                  label: "Total",
                  value: stats.total,
                  icon: BarChart3,
                  color: "bg-white/5 border-white/10",
                },
                {
                  label: "To Do",
                  value: stats.todo,
                  icon: Square,
                  color: "bg-white/5 border-white/10",
                },
                {
                  label: "In Progress",
                  value: stats.in_progress,
                  icon: Clock,
                  color: "bg-yellow-500/10 border-yellow-500/30",
                },
                {
                  label: "Completed",
                  value: stats.completed,
                  icon: CheckCircle,
                  color: "bg-green-500/10 border-green-500/30",
                },
                {
                  label: "Overdue",
                  value: stats.overdue,
                  icon: AlertCircle,
                  color: "bg-red-500/10 border-red-500/30",
                },
                {
                  label: "Due Today",
                  value: stats.due_today,
                  icon: Zap,
                  color: "bg-orange-500/10 border-orange-500/30",
                },
                {
                  label: "This Week",
                  value: stats.due_this_week,
                  icon: Calendar,
                  color: "bg-purple-500/10 border-purple-500/30",
                },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className={`${stat.color} rounded-xl p-5 border`}
                  >
                    <Icon size={18} className="text-gray-400 mb-3" />
                    <div className="text-2xl font-semibold mb-1">
                      {stat.value}
                    </div>
                    <div className="text-xs text-gray-500">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-3 bg-white/5 p-5 rounded-xl border border-white/10">
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30 transition-all text-sm"
            >
              <option value="">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>

            <select
              value={filter.course}
              onChange={(e) => setFilter({ ...filter, course: e.target.value })}
              className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30 transition-all text-sm"
            >
              <option value="">All Courses</option>
              {enrolledCourses.map((course) => (
                <option key={course.code} value={course.code}>
                  {course.code}
                </option>
              ))}
            </select>

            <select
              value={filter.priority}
              onChange={(e) =>
                setFilter({ ...filter, priority: e.target.value })
              }
              className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30 transition-all text-sm"
            >
              <option value="">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {(filter.status || filter.course || filter.priority) && (
              <button
                onClick={() =>
                  setFilter({ status: "", course: "", priority: "" })
                }
                className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-all text-red-400 font-medium text-sm"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Assignments List */}
        {assignments.length === 0 ? (
          <div className="text-center py-32 bg-white/5 rounded-xl border border-white/10">
            <FileText size={48} className="mx-auto mb-6 text-gray-500" />
            <h2 className="text-2xl font-semibold mb-3">No Assignments Yet</h2>
            <p className="text-gray-400 mb-8">
              Create your first assignment to get organized!
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-lg transition-all font-medium border border-white/20 inline-flex items-center gap-2"
            >
              <Plus size={18} />
              Create Assignment
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all hover:bg-white/[0.07]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="mt-1">
                      {getStatusIcon(assignment.status)}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">
                          {assignment.title}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-md text-xs font-medium border ${getPriorityColor(
                            assignment.priority
                          )}`}
                        >
                          {assignment.priority.toUpperCase()}
                        </span>
                      </div>

                      <p className="text-gray-500 text-sm mb-3">
                        {assignment.course_code}
                      </p>

                      {assignment.description && (
                        <p className="text-gray-400 mb-3 text-sm">
                          {assignment.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm">
                        <span
                          className={`flex items-center gap-1.5 ${
                            assignment.is_overdue
                              ? "text-red-400"
                              : "text-gray-500"
                          }`}
                        >
                          <Calendar size={14} />
                          Due:{" "}
                          {new Date(assignment.due_date).toLocaleDateString()}
                        </span>
                        {assignment.estimated_hours && (
                          <span className="text-gray-500 flex items-center gap-1.5">
                            <Clock size={14} />
                            {assignment.estimated_hours}h
                          </span>
                        )}
                        <span
                          className={`px-2 py-1 rounded-md text-xs border ${
                            assignment.days_until_due <= 1
                              ? "bg-red-500/10 border-red-500/30 text-red-400"
                              : assignment.days_until_due <= 3
                              ? "bg-orange-500/10 border-orange-500/30 text-orange-400"
                              : "bg-green-500/10 border-green-500/30 text-green-400"
                          }`}
                        >
                          {assignment.days_until_due} days left
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    {assignment.status === "todo" && (
                      <button
                        onClick={() =>
                          updateAssignmentStatus(assignment.id, "in_progress")
                        }
                        className="px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 rounded-lg transition-all text-yellow-400 text-sm font-medium"
                      >
                        Start
                      </button>
                    )}
                    {assignment.status === "in_progress" && (
                      <button
                        onClick={() =>
                          updateAssignmentStatus(assignment.id, "completed")
                        }
                        className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-lg transition-all text-green-400 text-sm font-medium"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateForm && (
        <CreateAssignmentForm
          enrolledCourses={enrolledCourses}
          onClose={() => setShowCreateForm(false)}
          onSubmit={() => {
            loadAssignments();
            loadStats();
          }}
          token={token}
        />
      )}
    </div>
  );
}

// Create Assignment Form Component
function CreateAssignmentForm({
  enrolledCourses,
  onClose,
  onSubmit,
  token,
}: {
  enrolledCourses: Course[];
  onClose: () => void;
  onSubmit: () => void;
  token: string | null;
}) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    course_code: "",
    due_date: "",
    priority: "medium" as "low" | "medium" | "high",
    estimated_hours: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.course_code || !formData.due_date) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8000/assignments", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || undefined,
          course_code: formData.course_code,
          due_date: new Date(formData.due_date).toISOString(),
          priority: formData.priority,
          estimated_hours: formData.estimated_hours
            ? parseFloat(formData.estimated_hours)
            : undefined,
        }),
      });

      if (response.ok) {
        onSubmit();
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to create assignment");
      }
    } catch (error) {
      setError("Network error. Please try again.");
      console.error("Error creating assignment:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-xl p-8 max-w-2xl w-full border border-white/10 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Create New Assignment</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-400">
              Assignment Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g., Project 1, Midterm Essay..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-400">
              Course *
            </label>
            <select
              value={formData.course_code}
              onChange={(e) =>
                setFormData({ ...formData, course_code: e.target.value })
              }
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30 transition-all"
            >
              <option value="">Select a course...</option>
              {enrolledCourses.map((course) => (
                <option key={course.code} value={course.code}>
                  {course.code} - {course.name || course.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-400">
              Due Date *
            </label>
            <input
              type="datetime-local"
              value={formData.due_date}
              onChange={(e) =>
                setFormData({ ...formData, due_date: e.target.value })
              }
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-400">
              Priority
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(["low", "medium", "high"] as const).map((priority) => (
                <button
                  key={priority}
                  type="button"
                  onClick={() => setFormData({ ...formData, priority })}
                  className={`px-4 py-3 rounded-lg font-medium transition-all border ${
                    formData.priority === priority
                      ? priority === "high"
                        ? "bg-red-500/20 border-red-500/50 text-red-400"
                        : priority === "medium"
                        ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-400"
                        : "bg-green-500/20 border-green-500/50 text-green-400"
                      : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-400">
              Estimated Hours (Optional)
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={formData.estimated_hours}
              onChange={(e) =>
                setFormData({ ...formData, estimated_hours: e.target.value })
              }
              placeholder="e.g., 5"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-400">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Add any notes or details about this assignment..."
              rows={4}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-all resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-all border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Creating...
                </div>
              ) : (
                "Create Assignment"
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-8 py-3 bg-white/5 hover:bg-white/10 rounded-lg font-medium transition-all border border-white/10 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// AI Assistant Page
function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      text: "Hey! I'm your AI study companion. I'm here to help you ace your courses. Ask me anything about:\n\n• Course concepts and explanations\n• Homework and assignments\n• Study strategies and tips\n• Document analysis\n• Exam preparation\n\nWhat would you like to work on?",
      sender: "ai",
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = [
        "application/pdf",
        "text/plain",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      const maxSize = 10 * 1024 * 1024;
      if (!allowedTypes.includes(file.type)) {
        alert("Please upload a PDF, TXT, or DOCX file");
        return;
      }
      if (file.size > maxSize) {
        alert("File size should be less than 10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() && !selectedFile) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage.trim() || "Uploaded a file",
      sender: "user",
      timestamp: new Date(),
      file: selectedFile
        ? {
            name: selectedFile.name,
            type: selectedFile.type,
            size: selectedFile.size,
          }
        : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("message", inputMessage.trim());
      if (selectedFile) formData.append("file", selectedFile);

      const response = await fetch("http://localhost:8000/ai/chat", {
        method: "POST",
        body: formData,
      });

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      const responseText = data.response || "Sorry, I couldn't process that.";

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: "ai",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble connecting. Make sure the backend is running!",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
      setInputMessage("");
      setSelectedFile(null);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-12 space-y-8">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.sender === "ai" && (
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 border border-white/20">
                  <Bot size={16} className="text-gray-400" />
                </div>
              )}
              <div
                className={`max-w-2xl rounded-xl px-6 py-4 ${
                  msg.sender === "user"
                    ? "bg-white/10 border border-white/20"
                    : "bg-white/5"
                }`}
              >
                <p className="text-white whitespace-pre-wrap leading-relaxed">
                  {msg.text}
                </p>
                {msg.file && (
                  <div className="mt-3 text-sm text-gray-400 flex items-center gap-2 bg-white/5 rounded px-3 py-2 border border-white/10">
                    <Paperclip size={14} />
                    <span>{msg.file.name}</span>
                  </div>
                )}
              </div>
              {msg.sender === "user" && (
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center ml-3 flex-shrink-0 border border-white/20">
                  <User size={16} className="text-gray-400" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center mr-3 border border-white/20">
                <Bot size={16} className="text-gray-400" />
              </div>
              <div className="bg-white/5 rounded-xl px-6 py-4">
                <div className="flex gap-1">
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-white/10 bg-black">
        <div className="max-w-4xl mx-auto px-8 py-6">
          {selectedFile && (
            <div className="mb-3 p-3 bg-white/5 rounded-lg flex items-center justify-between border border-white/10">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Paperclip size={16} />
                <span>{selectedFile.name}</span>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          )}

          <div className="flex items-end gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center transition-all"
            >
              <Paperclip size={18} className="text-gray-400" />
            </button>

            <div className="flex-1 relative bg-white/5 rounded-lg border border-white/10 focus-within:border-white/30 transition-all">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Message StudyFlow..."
                className="w-full px-4 py-3 bg-transparent text-white placeholder-gray-500 focus:outline-none resize-none rounded-lg"
                rows={1}
                style={{
                  minHeight: "44px",
                  maxHeight: "200px",
                }}
                disabled={isLoading}
              />
            </div>

            <button
              onClick={sendMessage}
              disabled={(!inputMessage.trim() && !selectedFile) || isLoading}
              className="w-10 h-10 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed rounded-lg transition-all flex items-center justify-center border border-white/20 disabled:border-white/10"
            >
              <Send
                size={18}
                className={
                  (!inputMessage.trim() && !selectedFile) || isLoading
                    ? "text-gray-600"
                    : "text-white"
                }
              />
            </button>
          </div>

          <p className="text-center text-xs text-gray-600 mt-3">
            StudyFlow can make mistakes. Check important info.
          </p>
        </div>
      </div>
    </div>
  );
}
