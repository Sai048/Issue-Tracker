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
        w-full
        rounded-3xl
        border border-slate-200
        bg-white
        shadow-sm

        lg:min-w-[360px]
        lg:max-w-[360px]
      "
    >
      {/* HEADER */}
      <div
        className="
          flex items-center justify-between
          gap-3
          border-b border-slate-200
          px-4 py-4
        "
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-lg font-bold text-slate-800">
              {section.name}
            </h2>

            <span
              className="
                rounded-full
                bg-slate-100
                px-2 py-1
                text-xs font-semibold
                text-slate-600
              "
            >
              {tasks.length}
            </span>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            {tasks.length === 0
              ? "No tasks available"
              : `${tasks.length} active task${
                  tasks.length !== 1 ? "s" : ""
                }`}
          </p>
        </div>

        <button
          onClick={() => onAddTask(section.id)}
          className="
            rounded-xl
            bg-teal-600
            px-4 py-2
            text-sm font-semibold
            text-white
            transition
            hover:bg-teal-700
          "
        >
          + Add
        </button>
      </div>

      {/* TASK LIST */}
      <Droppable droppableId={section.id}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="
              flex flex-col
              gap-4
              p-4
            "
          >
            {tasks.length === 0 ? (
              <div
                className="
                  flex min-h-[140px]
                  items-center justify-center
                  rounded-2xl
                  border-2 border-dashed
                  border-slate-300
                  bg-slate-50
                  text-center text-sm
                  text-slate-500
                "
              >
                Drop Tasks Here
              </div>
            ) : (
              tasks.map((task, index) => (
                <Draggable
                  key={task.id}
                  draggableId={task.id}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={
                        snapshot.isDragging
                          ? "rotate-1 scale-[1.02]"
                          : ""
                      }
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