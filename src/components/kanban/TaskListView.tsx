import { useEffect, useState } from "react";
import TaskService from "./service";
import type { Task } from "./task";

interface Props {
  projectId: string;
}

const TaskListView = ({ projectId }: Props) => {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  const fetchTasks = async () => {
    const data = await TaskService.getProjectTasks(projectId);

    setTasks(data || []);
  };

  return (
    <div
      className="
        h-full overflow-y-auto
        rounded-3xl border border-slate-200
        bg-white shadow-sm
      "
    >
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead
            className="
              sticky top-0 z-10
              border-b border-slate-200
              bg-slate-50
            "
          >
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                Task
              </th>

              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                Status
              </th>

              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                Priority
              </th>

              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                Assignee
              </th>

              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                Due Date
              </th>
            </tr>
          </thead>

          <tbody>
            {tasks.map((task) => (
              <tr
                key={task.id}
                className="
                  border-b border-slate-100
                  hover:bg-slate-50
                "
              >
                <td className="px-4 py-4">
                  <div>
                    <p className="font-medium text-slate-800">
                      {task.title}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {task.description || "No description"}
                    </p>
                  </div>
                </td>

                <td className="px-4 py-4">
                  <span
                    className="
                      rounded-full bg-slate-100
                      px-3 py-1 text-xs
                      font-medium capitalize
                    "
                  >
                    {task.status.replace("_", " ")}
                  </span>
                </td>

                <td className="px-4 py-4 capitalize">
                  {task.priority}
                </td>

                <td className="px-4 py-4">
                  {task.assigned_to || "Unassigned"}
                </td>

                <td className="px-4 py-4">
                  {task.due_date || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TaskListView;