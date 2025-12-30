import React from "react";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { JSX } from "react/jsx-runtime";

interface AssignmentStatsProps {
  stats: {
    total: number;
    completed: number;
    in_progress: number;
    pending: number;
    overdue: number;
  } | null;
  loading?: boolean;
}

export default function AssignmentStats({
  stats,
  loading = false,
}: AssignmentStatsProps): JSX.Element | null {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow-md p-4 animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-8"></div>
              </div>
              <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const completionRate =
    stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const statItems = [
    {
      label: "Total",
      value: stats.total,
      icon: TrendingUp,
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      iconColor: "text-blue-500",
    },
    {
      label: "Completed",
      value: stats.completed,
      icon: CheckCircle,
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      iconColor: "text-green-500",
    },
    {
      label: "In Progress",
      value: stats.in_progress,
      icon: Clock,
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      iconColor: "text-blue-500",
    },
    {
      label: "Pending",
      value: stats.pending,
      icon: AlertCircle,
      bgColor: "bg-gray-50",
      textColor: "text-gray-600",
      iconColor: "text-gray-500",
    },
    {
      label: "Overdue",
      value: stats.overdue,
      icon: Calendar,
      bgColor: "bg-red-50",
      textColor: "text-red-600",
      iconColor: "text-red-500",
    },
  ];

  return (
    <div className="mb-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
        {statItems.map((item) => (
          <div
            key={item.label}
            className={`bg-white rounded-lg shadow-md p-4 border border-gray-200 ${item.bgColor}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {item.label}
                </p>
                <p className={`text-2xl font-bold ${item.textColor}`}>
                  {item.value}
                </p>
              </div>
              <div className={`p-2 rounded-full ${item.bgColor}`}>
                <item.icon className={`w-6 h-6 ${item.iconColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      {stats.total > 0 && (
        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Completion Progress
            </span>
            <span className="text-sm font-bold text-green-600">
              {completionRate}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-green-600 h-3 rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{stats.completed} completed</span>
            <span>{stats.total} total</span>
          </div>
        </div>
      )}

      {/* Quick Insights */}
      {stats.total > 0 && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.overdue > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-sm text-red-700">
                  <strong>{stats.overdue}</strong> assignment
                  {stats.overdue !== 1 ? "s" : ""} overdue
                </span>
              </div>
            </div>
          )}

          {stats.in_progress > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-blue-500 mr-2" />
                <span className="text-sm text-blue-700">
                  <strong>{stats.in_progress}</strong> assignment
                  {stats.in_progress !== 1 ? "s" : ""} in progress
                </span>
              </div>
            </div>
          )}

          {stats.pending > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
                <span className="text-sm text-yellow-700">
                  <strong>{stats.pending}</strong> assignment
                  {stats.pending !== 1 ? "s" : ""} pending
                </span>
              </div>
            </div>
          )}

          {completionRate === 100 && stats.total > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 md:col-span-2">
              <div className="flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <span className="text-sm text-green-700 font-medium">
                  🎉 Congratulations! All assignments completed!
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {stats.total === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No assignments yet
          </h3>
          <p className="text-gray-600">
            Create your first assignment to get started with tracking your
            progress.
          </p>
        </div>
      )}
    </div>
  );
}
