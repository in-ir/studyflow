from fastapi import FastAPI, HTTPException, File, UploadFile, Form, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
import json
import os
from typing import List, Dict, Optional
import time
from dotenv import load_dotenv
import anthropic
from anthropic import Anthropic
import jwt
from datetime import datetime, timedelta, date
import bcrypt
from pydantic import BaseModel, EmailStr
import uuid

load_dotenv()

# Initialize Claude client
claude_client = None

def initialize_claude():
    """Initialize Claude client with API key"""
    global claude_client
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if api_key:
        claude_client = Anthropic(api_key=api_key)
        print("✅ Claude client initialized")
        return True
    else:
        print("⚠️  Claude API key not found - using fallback responses")
        return False

claude_available = initialize_claude()

# Create FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
COURSES_DATABASE = None
SUBJECTS_CACHE = None
USERS_DATABASE = {}
ASSIGNMENTS_DATABASE = {}
SCHEDULE_DATABASE = {}

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

security = HTTPBearer()

# ============= PYDANTIC MODELS =============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    student_id: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    student_id: Optional[str]
    created_at: datetime
    enrolled_courses: List[str] = []

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TimeSlot(BaseModel):
    day: str
    start_time: str
    end_time: str
    location: str
    type: str

class AssignmentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    course_code: str
    due_date: datetime
    priority: str
    estimated_hours: Optional[float] = None

class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    estimated_hours: Optional[float] = None

# ============= UTILITY FUNCTIONS =============

def save_users_to_file():
    """Save users database to file for persistence"""
    try:
        with open('users_data.json', 'w') as f:
            users_to_save = {}
            for user_id, user_data in USERS_DATABASE.items():
                user_copy = user_data.copy()
                user_copy['created_at'] = user_data['created_at'].isoformat()
                users_to_save[user_id] = user_copy
            json.dump(users_to_save, f, indent=2)
    except Exception as e:
        print(f"Error saving users: {e}")

def load_users_from_file():
    """Load users database from file"""
    global USERS_DATABASE
    try:
        if os.path.exists('users_data.json'):
            with open('users_data.json', 'r') as f:
                users_loaded = json.load(f)
                for user_id, user_data in users_loaded.items():
                    user_data['created_at'] = datetime.fromisoformat(user_data['created_at'])
                    USERS_DATABASE[user_id] = user_data
            print(f"✅ Loaded {len(USERS_DATABASE)} users from file")
    except Exception as e:
        print(f"Error loading users: {e}")

load_users_from_file()

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict):
    """Create JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify JWT token and return current user"""
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user = USERS_DATABASE.get(user_id)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return user
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def load_courses_efficiently():
    """Load all courses efficiently"""
    global COURSES_DATABASE, SUBJECTS_CACHE
    
    if COURSES_DATABASE is not None:
        return COURSES_DATABASE
    
    try:
        print("📚 Loading all courses...")
        start_time = time.time()
        
        if os.path.exists("fast_scraped_courses.json"):
            with open("fast_scraped_courses.json", 'r') as f:
                data = json.load(f)
                COURSES_DATABASE = data.get('courses', [])
                
                SUBJECTS_CACHE = list(set(course.get('subject', '') for course in COURSES_DATABASE if course.get('subject')))
                SUBJECTS_CACHE.sort()
                
                load_time = time.time() - start_time
                print(f"✅ Loaded {len(COURSES_DATABASE)} courses in {load_time:.2f} seconds")
                
                return COURSES_DATABASE
        else:
            print("❌ fast_scraped_courses.json not found!")
            return []
            
    except Exception as e:
        print(f"❌ Error loading courses: {e}")
        return []

def calculate_weekly_hours(time_slots: List[dict]) -> float:
    """Calculate total hours per week from time slots"""
    total_minutes = 0
    for slot in time_slots:
        try:
            start_hour, start_min = map(int, slot["start_time"].split(":"))
            end_hour, end_min = map(int, slot["end_time"].split(":"))
            
            start_total_min = start_hour * 60 + start_min
            end_total_min = end_hour * 60 + end_min
            
            total_minutes += (end_total_min - start_total_min)
        except:
            pass
    
    return total_minutes / 60.0

async def read_uploaded_file(file: UploadFile) -> str:
    """Read and extract text from uploaded file"""
    try:
        content = await file.read()
        
        if file.content_type == "text/plain":
            return content.decode('utf-8', errors='ignore')
        
        elif file.content_type == "application/pdf":
            try:
                import PyPDF2
                from io import BytesIO
                pdf_file = BytesIO(content)
                reader = PyPDF2.PdfReader(pdf_file)
                text = ""
                for page in reader.pages:
                    text += page.extract_text()
                return text[:5000]
            except ImportError:
                return f"[PDF file received: {file.filename} - Install PyPDF2: pip install PyPDF2]"
        
        elif file.content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            try:
                from docx import Document
                from io import BytesIO
                doc = Document(BytesIO(content))
                text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
                return text[:5000]
            except ImportError:
                return f"[DOCX file received: {file.filename} - Install python-docx: pip install python-docx]"
        
        else:
            return f"[File received: {file.filename} - Unsupported format]"
    
    except Exception as e:
        return f"[Error reading file: {str(e)}]"

# ============= COURSE ENDPOINTS =============

@app.get("/")
def read_root():
    """API health check"""
    courses = load_courses_efficiently()
    return {
        "message": "StudyFlow API is running!",
        "total_courses": len(courses),
        "available_subjects": len(SUBJECTS_CACHE) if SUBJECTS_CACHE else 0,
        "status": "healthy"
    }

@app.get("/courses/all")
def get_all_courses(limit: int = 200):
    """Get all courses with limit"""
    courses = load_courses_efficiently()
    
    return {
        "courses": courses[:limit],
        "total_available": len(courses),
        "limit": limit,
        "message": f"Showing {min(limit, len(courses))} of {len(courses)} total courses"
    }

@app.get("/courses/subjects")
def get_all_subjects():
    """Get all available subjects"""
    courses = load_courses_efficiently()
    
    if SUBJECTS_CACHE:
        subjects = SUBJECTS_CACHE
    else:
        subjects = list(set(course.get('subject', '') for course in courses if course.get('subject')))
        subjects.sort()
    
    return {
        "subjects": subjects,
        "count": len(subjects)
    }

@app.get("/courses/subject/{subject_code}")
def get_courses_by_subject(subject_code: str, limit: int = 50):
    """Get courses by subject"""
    courses = load_courses_efficiently()
    
    subject_courses = [
        course for course in courses 
        if course.get('subject', '').upper() == subject_code.upper()
    ]
    
    return {
        "subject": subject_code.upper(),
        "courses": subject_courses[:limit],
        "total_available": len(subject_courses),
        "limit": limit
    }

@app.get("/courses/search")
def search_courses(q: Optional[str] = None, subject: Optional[str] = None, limit: int = 50):
    """Search through courses"""
    courses = load_courses_efficiently()
    filtered_courses = courses
    
    if subject:
        filtered_courses = [
            course for course in filtered_courses 
            if course.get('subject', '').upper() == subject.upper()
        ]
    
    if q:
        search_term = q.lower()
        filtered_courses = [
            course for course in filtered_courses
            if (search_term in course.get('title', '').lower() or 
                search_term in course.get('code', '').lower() or
                search_term in course.get('description', '').lower())
        ]
    
    result_courses = filtered_courses[:limit]
    
    return {
        "query": q,
        "subject_filter": subject,
        "courses": result_courses,
        "count": len(result_courses),
        "total_matches": len(filtered_courses)
    }

# ============= AUTHENTICATION ENDPOINTS =============

@app.post("/auth/register")
def register(user_data: UserCreate):
    """Register a new user"""
    for user_id, user in USERS_DATABASE.items():
        if user["email"] == user_data.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    
    if not user_data.email.endswith("@uottawa.ca"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only @uottawa.ca emails are allowed"
        )
    
    if user_data.student_id and len(user_data.student_id) != 9:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student ID must be exactly 9 digits"
        )
    
    user_id = str(uuid.uuid4())
    hashed_password = hash_password(user_data.password)
    
    new_user = {
        "id": user_id,
        "email": user_data.email,
        "full_name": user_data.full_name,
        "student_id": user_data.student_id,
        "password_hash": hashed_password,
        "created_at": datetime.utcnow(),
        "enrolled_courses": []
    }
    
    USERS_DATABASE[user_id] = new_user
    save_users_to_file()
    
    access_token = create_access_token(data={"sub": user_id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": user_data.email,
            "full_name": user_data.full_name,
            "student_id": user_data.student_id,
            "created_at": new_user["created_at"],
            "enrolled_courses": []
        }
    }

@app.post("/auth/login")
def login(user_data: UserLogin):
    """Login user"""
    user = None
    user_id = None
    for uid, u in USERS_DATABASE.items():
        if u["email"] == user_data.email:
            user = u
            user_id = uid
            break
    
    if not user or not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    access_token = create_access_token(data={"sub": user_id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": user["email"],
            "full_name": user["full_name"],
            "student_id": user.get("student_id"),
            "created_at": user["created_at"],
            "enrolled_courses": user.get("enrolled_courses", [])
        }
    }

@app.get("/auth/me")
def get_current_user(user: dict = Depends(verify_token)):
    """Get current authenticated user"""
    return {
        "id": user["id"],
        "email": user["email"],
        "full_name": user["full_name"],
        "student_id": user.get("student_id"),
        "created_at": user["created_at"],
        "enrolled_courses": user.get("enrolled_courses", [])
    }

@app.post("/auth/logout")
def logout(user: dict = Depends(verify_token)):
    """Logout user"""
    return {"message": "Successfully logged out"}

# ============= ENROLLMENT ENDPOINTS =============

@app.post("/user/enroll/{course_code}")
def enroll_in_course(course_code: str, user: dict = Depends(verify_token)):
    """Enroll user in a course"""
    courses = load_courses_efficiently()
    course = next((c for c in courses if c.get("code") == course_code), None)
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Course {course_code} not found"
        )
    
    if course_code in user.get("enrolled_courses", []):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already enrolled in this course"
        )
    
    if "enrolled_courses" not in user:
        user["enrolled_courses"] = []
    
    user["enrolled_courses"].append(course_code)
    save_users_to_file()
    
    return {
        "message": f"Successfully enrolled in {course_code}",
        "course_code": course_code,
        "enrolled_courses": user["enrolled_courses"]
    }

@app.delete("/user/unenroll/{course_code}")
def unenroll_from_course(course_code: str, user: dict = Depends(verify_token)):
    """Unenroll user from a course"""
    if course_code not in user.get("enrolled_courses", []):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not enrolled in this course"
        )
    
    user["enrolled_courses"].remove(course_code)
    
    if user["id"] in SCHEDULE_DATABASE:
        SCHEDULE_DATABASE[user["id"]] = [
            s for s in SCHEDULE_DATABASE[user["id"]] 
            if s.get("course_code") != course_code
        ]
    
    save_users_to_file()
    
    return {
        "message": f"Successfully unenrolled from {course_code}",
        "enrolled_courses": user["enrolled_courses"]
    }

@app.get("/user/courses")
def get_user_courses(user: dict = Depends(verify_token)):
    """Get user's enrolled courses"""
    courses = load_courses_efficiently()
    enrolled_course_codes = user.get("enrolled_courses", [])
    
    enrolled_courses = []
    for course in courses:
        if course.get("code") in enrolled_course_codes:
            enrolled_courses.append(course)
    
    return {
        "user_id": user["id"],
        "enrolled_courses": enrolled_courses,
        "count": len(enrolled_courses)
    }

# ============= ASSIGNMENT ENDPOINTS =============

@app.post("/assignments")
def create_assignment(assignment: AssignmentCreate, user: dict = Depends(verify_token)):
    """Create a new assignment"""
    if assignment.course_code not in user.get("enrolled_courses", []):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are not enrolled in this course"
        )
    
    assignment_id = len(ASSIGNMENTS_DATABASE) + 1
    
    new_assignment = {
        "id": assignment_id,
        "user_id": user["id"],
        "title": assignment.title,
        "description": assignment.description or "",
        "course_code": assignment.course_code,
        "due_date": assignment.due_date.isoformat(),
        "priority": assignment.priority,
        "status": "pending",
        "estimated_hours": assignment.estimated_hours,
        "created_at": datetime.utcnow().isoformat()
    }
    
    ASSIGNMENTS_DATABASE[assignment_id] = new_assignment
    
    return new_assignment

@app.get("/assignments")
def get_assignments(
    user: dict = Depends(verify_token),
    status_filter: Optional[str] = None,
    course_code: Optional[str] = None,
    priority: Optional[str] = None
):
    """Get user's assignments with optional filtering"""
    assignments = [a for a in ASSIGNMENTS_DATABASE.values() if a["user_id"] == user["id"]]
    
    if status_filter:
        assignments = [a for a in assignments if a["status"] == status_filter]
    if course_code:
        assignments = [a for a in assignments if a["course_code"] == course_code]
    if priority:
        assignments = [a for a in assignments if a["priority"] == priority]
    
    return assignments

@app.get("/assignments/{assignment_id}")
def get_assignment(assignment_id: int, user: dict = Depends(verify_token)):
    """Get specific assignment"""
    assignment = ASSIGNMENTS_DATABASE.get(assignment_id)
    
    if not assignment or assignment["user_id"] != user["id"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )
    
    return assignment

@app.put("/assignments/{assignment_id}")
def update_assignment(
    assignment_id: int,
    update_data: AssignmentUpdate,
    user: dict = Depends(verify_token)
):
    """Update assignment"""
    assignment = ASSIGNMENTS_DATABASE.get(assignment_id)
    
    if not assignment or assignment["user_id"] != user["id"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )
    
    if update_data.title:
        assignment["title"] = update_data.title
    if update_data.description:
        assignment["description"] = update_data.description
    if update_data.status:
        assignment["status"] = update_data.status
    if update_data.priority:
        assignment["priority"] = update_data.priority
    if update_data.estimated_hours is not None:
        assignment["estimated_hours"] = update_data.estimated_hours
    
    return assignment

@app.delete("/assignments/{assignment_id}")
def delete_assignment(assignment_id: int, user: dict = Depends(verify_token)):
    """Delete assignment"""
    assignment = ASSIGNMENTS_DATABASE.get(assignment_id)
    
    if not assignment or assignment["user_id"] != user["id"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )
    
    del ASSIGNMENTS_DATABASE[assignment_id]
    
    return {"message": "Assignment deleted"}

@app.get("/assignments/summary/stats")
def get_assignment_stats(user: dict = Depends(verify_token)):
    """Get assignment statistics"""
    user_assignments = [a for a in ASSIGNMENTS_DATABASE.values() if a["user_id"] == user["id"]]
    
    stats = {
        "total": len(user_assignments),
        "pending": len([a for a in user_assignments if a["status"] == "pending"]),
        "in_progress": len([a for a in user_assignments if a["status"] == "in_progress"]),
        "completed": len([a for a in user_assignments if a["status"] == "completed"]),
        "overdue": 0,
        "due_today": 0,
        "due_this_week": 0
    }
    
    today = date.today()
    week_end = today + timedelta(days=7)
    
    for assignment in user_assignments:
        try:
            due_date = datetime.fromisoformat(assignment["due_date"]).date()
            
            if due_date < today and assignment["status"] != "completed":
                stats["overdue"] += 1
            elif due_date == today:
                stats["due_today"] += 1
            elif today <= due_date <= week_end:
                stats["due_this_week"] += 1
        except:
            pass
    
    return stats

# ============= SCHEDULE ENDPOINTS =============

@app.post("/schedule/manual")
def add_manual_schedule(
    course_code: str = Form(...),
    course_title: str = Form(...),
    day: str = Form(...),
    start_time: str = Form(...),
    end_time: str = Form(...),
    location: str = Form(...),
    session_type: str = Form(...),
    is_personal: bool = Form(False),
    user: dict = Depends(verify_token)
):
    """Add a manual schedule entry"""
    user_id = user["id"]
    
    # For non-personal events, check if user is enrolled
    if not is_personal and course_code not in user.get("enrolled_courses", []):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are not enrolled in this course"
        )
    
    if user_id not in SCHEDULE_DATABASE:
        SCHEDULE_DATABASE[user_id] = []
    
    # Find or create course schedule
    course_schedule = next(
        (s for s in SCHEDULE_DATABASE[user_id] if s.get("course_code") == course_code),
        None
    )
    
    if not course_schedule:
        # Generate a color for personal events
        colors = ["blue", "purple", "green", "red", "yellow", "pink", "orange"]
        color = colors[len(SCHEDULE_DATABASE[user_id]) % len(colors)]
        
        course_schedule = {
            "course_code": course_code,
            "course_title": course_title,
            "color": color,
            "time_slots": [],
            "is_personal": is_personal
        }
        SCHEDULE_DATABASE[user_id].append(course_schedule)
    
    # Add time slot
    time_slot = {
        "day": day,
        "start_time": start_time,
        "end_time": end_time,
        "location": location,
        "type": session_type
    }
    
    course_schedule["time_slots"].append(time_slot)
    
    return {
        "message": "Successfully added to schedule",
        "course_code": course_code,
        "course_title": course_title,
        "time_slot": time_slot
    }

@app.post("/schedule/{course_code}/slot")
def add_schedule_slot(
    course_code: str,
    slot: TimeSlot,
    user: dict = Depends(verify_token)
):
    """Add a time slot to user's schedule"""
    if course_code not in user.get("enrolled_courses", []):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are not enrolled in this course"
        )
    
    user_id = user["id"]
    if user_id not in SCHEDULE_DATABASE:
        SCHEDULE_DATABASE[user_id] = []
    
    course_schedule = next(
        (s for s in SCHEDULE_DATABASE[user_id] if s.get("course_code") == course_code),
        None
    )
    
    if not course_schedule:
        course_schedule = {
            "course_code": course_code,
            "course_title": f"Course {course_code}",
            "color": "blue",
            "time_slots": [],
            "is_personal": False
        }
        SCHEDULE_DATABASE[user_id].append(course_schedule)
    
    course_schedule["time_slots"].append(slot.dict())
    
    return {"message": "Time slot added", "course_code": course_code}

@app.delete("/schedule/{course_code}/slot")
def remove_schedule_slot(
    course_code: str,
    day: str,
    start_time: str,
    user: dict = Depends(verify_token)
):
    """Remove a time slot from schedule"""
    user_id = user["id"]
    
    if user_id in SCHEDULE_DATABASE:
        for course_schedule in SCHEDULE_DATABASE[user_id]:
            if course_schedule.get("course_code") == course_code:
                course_schedule["time_slots"] = [
                    s for s in course_schedule["time_slots"]
                    if not (s.get("day") == day and s.get("start_time") == start_time)
                ]
    
    return {"message": "Time slot removed"}

@app.get("/schedule")
def get_schedule(user: dict = Depends(verify_token)):
    """Get user's schedule"""
    user_id = user["id"]
    schedule = SCHEDULE_DATABASE.get(user_id, [])
    
    total_hours = 0.0
    for course in schedule:
        total_hours += calculate_weekly_hours(course.get("time_slots", []))
    
    return {
        "schedule": schedule,
        "total_courses": len(schedule),
        "total_hours_per_week": total_hours
    }

@app.get("/schedule/conflicts")
def check_schedule_conflicts(user: dict = Depends(verify_token)):
    """Check for schedule conflicts"""
    user_id = user["id"]
    schedule = SCHEDULE_DATABASE.get(user_id, [])
    conflicts = []
    
    for i, course1 in enumerate(schedule):
        for course2 in schedule[i+1:]:
            for slot1 in course1.get("time_slots", []):
                for slot2 in course2.get("time_slots", []):
                    if slot1.get("day") == slot2.get("day"):
                        try:
                            start1 = int(slot1.get("start_time", "0:0").split(":")[0])
                            end1 = int(slot1.get("end_time", "0:0").split(":")[0])
                            start2 = int(slot2.get("start_time", "0:0").split(":")[0])
                            end2 = int(slot2.get("end_time", "0:0").split(":")[0])
                            
                            if start1 < end2 and start2 < end1:
                                conflicts.append({
                                    "course1": course1.get("course_code"),
                                    "course2": course2.get("course_code"),
                                    "day": slot1.get("day")
                                })
                        except:
                            pass
    
    return {"conflicts": conflicts}

# ============= AI ENDPOINTS =============

@app.post("/ai/chat")
async def chat_with_ai(
    message: str = Form(...),
    file: Optional[UploadFile] = File(None)
):
    """Chat with AI assistant with optional file upload"""
    try:
        file_content = ""
        file_name = None
        
        if file:
            file_name = file.filename
            file_content = await read_uploaded_file(file)
            print(f"📄 Processed file: {file_name}")
        
        full_prompt = message
        if file_content and not file_content.startswith("["):
            full_prompt += f"\n\nFile content:\n{file_content}"
        elif file_content:
            full_prompt += f"\n\n{file_content}"
        
        print(f"🤖 Processing AI request: {message[:100]}..." + (" [with file]" if file else ""))
        
        if claude_available and claude_client:
            ai_response = await call_claude_api(full_prompt)
        else:
            ai_response = generate_smart_response(full_prompt, file is not None)
        
        return {
            "response": ai_response,
            "message_processed": message,
            "file_uploaded": file_name,
            "timestamp": int(time.time()),
            "service": "StudyFlow AI Assistant"
        }
        
    except Exception as e:
        print(f"❌ Error in AI chat: {str(e)}")
        return {
            "response": "I apologize, but I'm experiencing some technical difficulties. Please try again later!",
            "error": str(e),
            "timestamp": int(time.time())
        }

async def call_claude_api(prompt: str) -> str:
    """Call Claude API for intelligent responses"""
    try:
        if not claude_client:
            return generate_smart_response(prompt)
        
        courses = load_courses_efficiently()
        course_context = get_relevant_course_context(prompt, courses)
        
        system_prompt = f"""You are an intelligent AI Study Assistant for University of Ottawa students. You help with:

- Course concepts and detailed explanations
- Study strategies and exam preparation
- Problem-solving with step-by-step guidance  
- Academic support across all subjects

University Context:
- You have access to {len(courses)} real uOttawa courses
- Key subjects: CSI (Computer Science), MAT (Mathematics), SEG (Software Engineering), CEG (Computer Engineering), PHY (Physics)
- Current semester: Fall 2025

{course_context}

Be conversational, encouraging, and provide detailed explanations with examples when helpful."""

        response = claude_client.messages.create(
            model="claude-3-5-haiku-20241022",
            max_tokens=1000,
            temperature=0.7,
            system=system_prompt,
            messages=[{"role": "user", "content": prompt}]
        )
        
        return response.content[0].text
        
    except Exception as e:
        print(f"❌ Claude API error: {str(e)}")
        return generate_smart_response(prompt)

def get_relevant_course_context(message: str, courses: list) -> str:
    """Get relevant course information based on the user's message"""
    message_lower = message.lower()
    context_parts = []
    
    subjects = {"csi": "Computer Science", "mat": "Mathematics", "seg": "Software Engineering", 
               "ceg": "Computer Engineering", "phy": "Physics"}
    
    for subject, full_name in subjects.items():
        if subject in message_lower:
            subject_courses = [c for c in courses if c.get('subject') == subject.upper()][:3]
            if subject_courses:
                context_parts.append(f"{full_name} courses: " + 
                                   ", ".join(f"{c.get('code')}" for c in subject_courses))
    
    if context_parts:
        return "Relevant uOttawa Courses: " + "; ".join(context_parts)
    return ""

def generate_smart_response(prompt: str, has_file: bool = False) -> str:
    """Generate smart fallback responses based on keywords"""
    prompt_lower = prompt.lower()
    
    courses = load_courses_efficiently()
    course_context = ""
    
    if any(subject in prompt_lower for subject in ["csi", "mat", "seg", "ceg", "phy", "chm", "eco", "eng"]):
        subject_matches = [s for s in SUBJECTS_CACHE or [] if s.lower() in prompt_lower]
        if subject_matches:
            subject = subject_matches[0]
            subject_courses = [c for c in courses if c.get('subject') == subject][:3]
            if subject_courses:
                course_context = f"\n\nRelated {subject} Courses at uOttawa:\n"
                for course in subject_courses:
                    course_context += f"• {course.get('code')} - {course.get('title', 'N/A')}\n"
    
    if has_file or "uploaded" in prompt_lower or "file" in prompt_lower:
        return f"""Thanks for uploading your document!

I can see you've shared a file with me. Here's how I can help:

Document Analysis:
• Ask me specific questions about the content
• Request summaries of key concepts
• Get help understanding difficult sections
• Create study guides from the document

What you can try:
• "Explain the main concepts from this document"
• "What are the key points I should focus on?"
• "Help me understand [specific topic]"
• "Create study questions based on this material"

Study Tips:
• Break down complex documents into smaller sections
• Create your own summary after reading my explanations
• Practice active recall by testing yourself

What specific aspect of your document would you like help with?{course_context}"""

    if any(word in prompt_lower for word in ["study", "tips", "exam", "test", "prepare", "midterm", "final"]):
        return f"""Here are some proven study strategies for university success!

Active Learning Techniques:
• Pomodoro Technique: 25 min focused study + 5 min break
• Feynman Method: Explain concepts in simple terms
• Active Recall: Test yourself instead of just re-reading
• Spaced Repetition: Review material at increasing intervals

Exam Preparation Strategy:
• Start studying 1-2 weeks before the exam
• Create a realistic study schedule
• Form study groups with classmates
• Practice with past exams
• Identify and focus on weak areas

Memory Enhancement:
• Create mind maps and visual diagrams
• Use mnemonics and memory palaces
• Connect new concepts to things you know
• Get 7-9 hours of sleep
• Exercise regularly to boost brain function

Day-of-Exam Tips:
• Arrive early with extra supplies
• Read all questions before starting
• Start with questions you're confident about
• Manage your time wisely

Would you like me to elaborate on any of these strategies?{course_context}"""

    elif any(word in prompt_lower for word in ["math", "calculus", "derivative", "integral", "equation", "algebra", "statistics"]):
        return f"""I'd love to help you with mathematics!

For Calculus (MAT courses):
• Derivatives: Measure rates of change
• Integrals: Find area under curves
• Fundamental Theorem: Links derivatives and integrals
• Applications: Optimization, related rates, physics

Problem-Solving Strategy:
1. Understand: What type of problem is this?
2. Plan: What formulas/methods apply?
3. Execute: Work through step-by-step
4. Check: Does your answer make sense?

uOttawa Math Resources:
• Math Help Center in STEM building
• Online practice problems on Brightspace
• Study groups with classmates
• Professor's office hours

Study Tips for Math:
• Practice daily (even 20-30 minutes helps!)
• Work through examples first
• Understand the "why" behind formulas
• Don't just memorize

What specific math topic can I help with?{course_context}"""

    elif any(word in prompt_lower for word in ["programming", "code", "algorithm", "data structure", "csi", "java", "python", "c++"]):
        return f"""Great! I can help with programming and computer science!

Data Structures (CSI 2110):
• Arrays: Fixed size, O(1) access
• Linked Lists: Dynamic size, O(n) traversal
• Stacks: LIFO - great for recursion
• Queues: FIFO - great for BFS
• Trees: Hierarchical, O(log n) operations

Algorithm Analysis:
• Time Complexity: How runtime grows
• Space Complexity: How memory grows
• Big O Notation: O(1), O(log n), O(n), O(n²)
• Common Patterns: Divide & conquer, dynamic programming

Programming Best Practices:
• Write clean, readable code
• Comment complex logic
• Test with different inputs
• Use version control (Git)
• Debug systematically

CSI Course Tips:
• Practice coding regularly
• Work through textbook examples
• Join programming study groups
• Use LeetCode for extra practice

What specific programming concept or problem can I help with?{course_context}"""

    elif any(word in prompt_lower for word in ["engineering", "physics", "phy", "ceg", "mechanics", "circuits", "thermodynamics"]):
        return f"""Perfect! I can help with engineering and physics!

Engineering Problem-Solving:
• Understand the System: Draw diagrams
• Apply Principles: Use fundamental laws
• Check Units: Dimensional analysis
• Validate Results: Does it make sense?

Physics Fundamentals:
• Mechanics: Forces, motion, energy, momentum
• Circuits: Ohm's law, Kirchhoff's laws
• Thermodynamics: Heat, work, entropy
• Waves: Frequency, wavelength, interference

Engineering Design Process:
1. Define the problem
2. Research and brainstorm
3. Select best approach
4. Analyze and optimize
5. Test and iterate

Study Strategies:
• Work lots of practice problems
• Understand concepts first
• Create summary sheets
• Form study groups
• Attend labs and office hours

What specific engineering or physics topic can I help clarify?{course_context}"""

    elif any(word in prompt_lower for word in ["explain", "understand", "concept", "help", "what is", "how does"]):
        return f"""I'm here to help you understand any academic concept!

To give you the best explanation, tell me:
• What subject area is this from?
• What specifically are you struggling with?
• What's your current level of understanding?
• Do you have a specific example or problem?

I can help with various subjects:
• Mathematics: Calculus, algebra, statistics
• Computer Science: Programming, algorithms, data structures
• Engineering: Mechanics, circuits, thermodynamics
• Sciences: Physics, chemistry, biology
• Study Skills: Time management, note-taking, exam prep

My approach:
• Break complex ideas into simple parts
• Provide real-world examples
• Connect to things you already know
• Suggest practice and resources

uOttawa Resources:
• Academic Writing Help Service
• Math Help Center
• Science Study Groups
• Professor office hours

Please share the specific concept you'd like me to explain!{course_context}"""

    else:
        return f"""Hello! I'm your AI Study Assistant for University of Ottawa students!

I'm here to help you with:
• Course Content: Explain concepts from CSI, MAT, SEG, CEG, PHY
• Study Strategies: Effective techniques for learning
• Problem Solving: Step-by-step guidance
• Exam Preparation: Study plans and practice
• Document Analysis: Upload PDFs, TXT, or DOCX files

Popular subjects I assist with:
• Computer Science (CSI) - Programming, algorithms, data structures
• Mathematics (MAT) - Calculus, algebra, statistics
• Engineering (CEG/SEG) - Architecture, software engineering
• Physics (PHY) - Mechanics, circuits, thermodynamics
• And many more uOttawa courses!

Try asking me things like:
• "Help me understand calculus derivatives"
• "Explain data structures and algorithms"
• "Give me study tips for my physics exam"
• "What should I focus on for CSI 2110?"

What would you like help with today?{course_context}"""

@app.get("/ai/status")
async def ai_status():
    """Check AI service status"""
    courses = load_courses_efficiently()
    
    actual_service = "Enhanced Fallback"
    model_info = "Pattern-based responses"
    
    if claude_client:
        try:
            test_response = claude_client.messages.create(
                model="claude-3-5-haiku-20241022",
                max_tokens=50,
                messages=[{"role": "user", "content": "Hello"}]
            )
            actual_service = "Claude API"
            model_info = "claude-3-5-haiku-20241022"
        except:
            actual_service = "Enhanced Fallback (Claude Failed)"
            model_info = "Claude API key present but not working"
    
    return {
        "status": "online",
        "actual_service": actual_service,
        "model_info": model_info,
        "claude_client_exists": claude_client is not None,
        "course_database": f"{len(courses)} uOttawa courses",
        "response_quality": "High" if "API" in actual_service else "Good"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


    

    