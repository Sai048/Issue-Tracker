import TaskCard from "./TaskCard";
import type { Task } from "./task";
import { Droppable, Draggable } from "@hello-pangea/dnd";

interface User {
  id: string;
  full_name: string;
}

interface Section {
  id: string;
  name: string;
}

interface KanbanColumnProps {
  section: Section;
  tasks: Task[];
  users: User[];
  onTaskClick: (taskId: string) => void;
  onAddTask: (sectionId: string) => void;
}

const KanbanColumn = ({
  section,
  tasks,
  users,
  onTaskClick,
  onAddTask,
}: KanbanColumnProps) => {
  return (
    <div
      className="
    flex-1 overflow-y-auto
  "
    >
      {/* Header */}
      <div
        className="
          sticky top-0 z-10
          flex items-center justify-between
          rounded-t-3xl border-b border-slate-200
          bg-slate-50/95 px-5 py-4 backdrop-blur
        "
      >
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h2 className="truncate text-lg font-bold text-slate-800">
              {section.name}
            </h2>

            <span
              className="
                rounded-full bg-slate-200
                px-2.5 py-1 text-xs font-semibold text-slate-700
              "
            >
              {tasks.length}
            </span>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            {tasks.length === 0
              ? "No tasks available"
              : `${tasks.length} active task${tasks.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        <button
          onClick={() => onAddTask(section.id)}
          className="
            shrink-0 rounded-xl bg-teal-500
            px-4 py-2 text-sm font-semibold text-white
            transition-all duration-200
            hover:bg-teal-600 hover:shadow-md
            active:scale-95 cursor-pointer
          "
        >
          + Add
        </button>
      </div>

      {/* Task List */}
      <Droppable droppableId={section.id}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex-1 space-y-4 p-4"
          >
            {tasks.length === 0 ? (
              <div
                className="
            flex min-h-[220px]
            items-center
            justify-center
            rounded-2xl
            border-2
            border-dashed
            border-slate-300
            bg-white
          "
              >
                Drop Tasks Here
              </div>
            ) : (
              tasks.map((task, index) => (
                <Draggable key={task.id} draggableId={task.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <TaskCard
                        task={task}
                        users={users}
                        onClick={onTaskClick}
                        isDragging={snapshot.isDragging}
                      />
                    </div>
                  )}
                </Draggable>
              ))
            )}

            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default KanbanColumn;
