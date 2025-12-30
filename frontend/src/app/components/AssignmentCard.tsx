import React from "react";
import {
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Edit,
  Trash2,
} from "lucide-react";

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

interface AssignmentCardProps {
  assignment: Assignment;
  onUpdate: (id: number, updates: Partial<Assignment>) => void;
  onDelete: (id: number) => void;
  onEdit: (assignment: Assignment) => void;
}

export default function AssignmentCard({
  assignment,
  onUpdate,
  onDelete,
  onEdit,
}: AssignmentCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "in_progress":
        return <Clock className="w-4 h-4" />;
      case "pending":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)} days overdue`, isOverdue: true };
    } else if (diffDays === 0) {
      return { text: "Due today", isOverdue: false };
    } else if (diffDays === 1) {
      return { text: "Due tomorrow", isOverdue: false };
    } else {
      return { text: `Due in ${diffDays} days`, isOverdue: false };
    }
  };

  const dueDateInfo = formatDate(assignment.due_date);

  const handleStatusChange = (newStatus: string) => {
    onUpdate(assignment.id, { status: newStatus as Assignment["status"] });
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {assignment.title}
          </h3>
          <p className="text-gray-600 text-sm mb-3">{assignment.description}</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(assignment)}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(assignment.id)}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {assignment.course_code}
        </span>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
            assignment.priority
          )}`}
        >
          {assignment.priority.toUpperCase()} PRIORITY
        </span>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(
            assignment.status
          )}`}
        >
          {getStatusIcon(assignment.status)}
          {assignment.status.replace("_", " ").toUpperCase()}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1 text-sm">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span
            className={
              dueDateInfo.isOverdue
                ? "text-red-600 font-medium"
                : "text-gray-600"
            }
          >
            {dueDateInfo.text}
          </span>
        </div>

        <div className="flex space-x-1">
          {assignment.status !== "pending" && (
            <button
              onClick={() => handleStatusChange("pending")}
              className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Pending
            </button>
          )}
          {assignment.status !== "in_progress" && (
            <button
              onClick={() => handleStatusChange("in_progress")}
              className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
            >
              In Progress
            </button>
          )}
          {assignment.status !== "completed" && (
            <button
              onClick={() => handleStatusChange("completed")}
              className="px-3 py-1 text-xs font-medium text-green-600 bg-green-100 hover:bg-green-200 rounded-md transition-colors"
            >
              Complete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
