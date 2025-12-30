import React, { useState } from "react";
import { X, Calendar, BookOpen, AlertTriangle } from "lucide-react";

interface Course {
  course_code: string;
  course_title: string;
}

interface Assignment {
  id: number;
  title: string;
  description: string;
  course_code: string;
  due_date: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "in_progress" | "completed";
  created_at: string;
}

interface CreateAssignmentFormProps {
  onClose: () => void;
  onSubmit: (assignmentData: {
    title: string;
    description: string;
    course_code: string;
    due_date: string;
    priority: string;
  }) => Promise<void>;
  enrolledCourses: Course[];
  editingAssignment?: Assignment | null;
}

export default function CreateAssignmentForm({
  onClose,
  onSubmit,
  enrolledCourses,
  editingAssignment,
}: CreateAssignmentFormProps) {
  const [formData, setFormData] = useState({
    title: editingAssignment?.title || "",
    description: editingAssignment?.description || "",
    course_code: editingAssignment?.course_code || "",
    due_date: editingAssignment?.due_date
      ? editingAssignment.due_date.split("T")[0]
      : "",
    priority: editingAssignment?.priority || "medium",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Assignment title is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Assignment description is required";
    }

    if (!formData.course_code) {
      newErrors.course_code = "Please select a course";
    }

    if (!formData.due_date) {
      newErrors.due_date = "Due date is required";
    } else {
      const selectedDate = new Date(formData.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        newErrors.due_date = "Due date cannot be in the past";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const submissionData = {
        ...formData,
        due_date: `${formData.due_date}T23:59:59`,
      };

      await onSubmit(submissionData);
      onClose();
    } catch (error) {
      console.error("Error submitting assignment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingAssignment ? "Edit Assignment" : "Create New Assignment"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Assignment Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.title ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter assignment title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                {errors.title}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.description ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Describe the assignment details"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                {errors.description}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="course_code"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Course *
            </label>
            <select
              id="course_code"
              name="course_code"
              value={formData.course_code}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.course_code ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">Select a course</option>
              {enrolledCourses.map((course) => (
                <option key={course.course_code} value={course.course_code}>
                  {course.course_code} - {course.course_title}
                </option>
              ))}
            </select>
            {errors.course_code && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                {errors.course_code}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="due_date"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Due Date *
            </label>
            <div className="relative">
              <input
                type="date"
                id="due_date"
                name="due_date"
                value={formData.due_date}
                onChange={handleInputChange}
                min={new Date().toISOString().split("T")[0]}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.due_date ? "border-red-500" : "border-gray-300"
                }`}
              />
              <Calendar className="absolute right-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
            {errors.due_date && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                {errors.due_date}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="priority"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Priority Level
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting
                ? "Saving..."
                : editingAssignment
                ? "Update Assignment"
                : "Create Assignment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
