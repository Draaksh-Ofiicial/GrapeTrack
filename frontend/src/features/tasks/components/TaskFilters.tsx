import type { TaskStatus, TaskPriority } from '@/types/task.types';

interface TaskFiltersProps {
  statusFilter?: TaskStatus;
  priorityFilter?: TaskPriority;
  searchQuery?: string;
  onStatusChange?: (status: TaskStatus | undefined) => void;
  onPriorityChange?: (priority: TaskPriority | undefined) => void;
  onSearchChange?: (query: string) => void;
}

export const TaskFilters = ({
  statusFilter,
  priorityFilter,
  searchQuery,
  onStatusChange,
  onPriorityChange,
  onSearchChange,
}: TaskFiltersProps) => {
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
      <h3 className="font-semibold text-gray-900">Filters</h3>

      {/* Search */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search
        </label>
        <input
          type="text"
          placeholder="Search tasks by title..."
          value={searchQuery || ''}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Status Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Status
        </label>
        <select
          value={statusFilter || ''}
          onChange={(e) =>
            onStatusChange?.(e.target.value as TaskStatus | undefined)
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Priority Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Priority
        </label>
        <select
          value={priorityFilter || ''}
          onChange={(e) =>
            onPriorityChange?.(e.target.value as TaskPriority | undefined)
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      {/* Clear Filters Button */}
      {(statusFilter || priorityFilter || searchQuery) && (
        <button
          onClick={() => {
            onStatusChange?.(undefined);
            onPriorityChange?.(undefined);
            onSearchChange?.('');
          }}
          className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
};
