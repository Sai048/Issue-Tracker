import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";

import { supabase } from "../../components/supabase-client";

import TaskForm from "./TaskForm";
import TaskDrawer from "./TaskDrawer";
import KanbanColumn from "./KanbanColumn";

import TaskService from "./service";

import type { Task, Section } from "./task";

interface User {
  id: string;
  full_name: string;
}

interface KanbanBoardProps {
  projectId: string;
}

interface TeamMemberResponse {
  user_id: string;
  profiles: User[] | null;
}

const KanbanBoard = ({ projectId }: KanbanBoardProps) => {
  const [loading, setLoading] = useState(true);

  const [tasks, setTasks] = useState<Task[]>([]);

  const [sections, setSections] = useState<Section[]>([]);

  const [users, setUsers] = useState<User[]>([]);

  const [drawerOpen, setDrawerOpen] = useState(false);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);

  const [selectedSectionId, setSelectedSectionId] = useState("");

  // ===========================
  // Create Default Sections
  // ===========================

  const createDefaultSections = async () => {
    const payload = [
      {
        project_id: projectId,
        name: "Todo",
        position: 1,
      },
      {
        project_id: projectId,
        name: "In Progress",
        position: 2,
      },
      {
        project_id: projectId,
        name: "Review",
        position: 3,
      },
      {
        project_id: projectId,
        name: "Completed",
        position: 4,
      },
    ];

    const { error } = await supabase.from("sections").insert(payload);

    if (error) {
      console.error(error);
      return;
    }

    await fetchSections();
  };

  // ===========================
  // Fetch Sections
  // ===========================

  const fetchSections = async () => {
    const { data, error } = await supabase
      .from("sections")
      .select("*")
      .eq("project_id", projectId)
      .order("position", {
        ascending: true,
      });

    if (error) {
      console.error(error);
      return;
    }

    setSections((data as Section[]) || []);
  };

  // ===========================
  // Fetch Tasks
  // ===========================

  const fetchTasks = async () => {
    try {
      const data = await TaskService.getProjectTasks(projectId);

      console.log("FETCHED TASKS:", data);

      setTasks(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  // ===========================
  // Fetch Users
  // ===========================

  const fetchUsers = async () => {
    const { data: projectTeams, error: projectError } = await supabase
      .from("project_teams")
      .select("team_id")
      .eq("project_id", projectId);

    if (projectError) {
      console.error(projectError);
      return;
    }

    const teamIds =
      projectTeams?.map((team: { team_id: string }) => team.team_id) || [];

    if (teamIds.length === 0) {
      setUsers([]);
      return;
    }

    const { data: members, error: memberError } = await supabase
      .from("team_members")
      .select(
        `
      user_id,
      profiles!team_members_user_id_fkey (
        id,
        full_name
      )
    `,
      )
      .in("team_id", teamIds);
    if (memberError) {
      console.error(memberError);
      return;
    }

    const memberData = (members || []) as TeamMemberResponse[];

    const extractedUsers = memberData.flatMap(
      (member) => member.profiles || [],
    );

    // Remove duplicates
    const uniqueUsers = Array.from(
      new Map(extractedUsers.map((user) => [user.id, user])).values(),
    );

    setUsers(uniqueUsers);
  };

  // ===========================
  // Refresh Board
  // ===========================

  const refreshBoard = async () => {
    try {
      setLoading(true);

      await Promise.all([fetchSections(), fetchTasks(), fetchUsers()]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ===========================
  // Initial Load
  // ===========================

  useEffect(() => {
    if (projectId) {
      refreshBoard();
    }
  }, [projectId]);

  // ===========================
  // Create Default Sections
  // ===========================

  useEffect(() => {
    if (!loading && projectId && sections.length === 0) {
      createDefaultSections();
    }
  }, [loading, projectId, sections.length]);

  // ===========================
  // Drawer
  // ===========================

  const openTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedTaskId(null);
  };

  // ===========================
  // Create Task
  // ===========================

  const addTask = (sectionId: string) => {
    setSelectedSectionId(sectionId);

    setCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setCreateModalOpen(false);

    setSelectedSectionId("");
  };

  const handleTaskCreated = async () => {
    closeCreateModal();

    await refreshBoard();
  };

  // ===========================
  // Drag Drop
  // ===========================

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) return;

    // no move
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // clone all tasks
    const updatedTasks = [...tasks];

    // source column
    const sourceColumnTasks = updatedTasks
      .filter((task) => task.section_id === source.droppableId)
      .sort((a, b) => a.position - b.position);

    // destination column
    const destinationColumnTasks =
      source.droppableId === destination.droppableId
        ? sourceColumnTasks
        : updatedTasks
            .filter((task) => task.section_id === destination.droppableId)
            .sort((a, b) => a.position - b.position);

    // remove dragged task
    const [movedTask] = sourceColumnTasks.splice(source.index, 1);

    if (!movedTask) return;

    // destination section
    const destinationSection = sections.find(
      (section) => section.id === destination.droppableId,
    );

    // status mapping
    const sectionStatusMap: Record<string, Task["status"]> = {
      todo: "todo",
      "in progress": "in_progress",
      review: "review",
      completed: "completed",
    };

    // update moved task
    movedTask.section_id = destination.droppableId;

    if (destinationSection) {
      movedTask.status =
        sectionStatusMap[destinationSection.name.toLowerCase()] ??
        movedTask.status;
    }

    // insert task into destination
    destinationColumnTasks.splice(destination.index, 0, movedTask);

    // rebuild positions
    const finalTasks: Task[] = [];

    sections.forEach((section) => {
      let columnTasks: Task[] = [];

      // same column drag
      if (
        source.droppableId === destination.droppableId &&
        section.id === source.droppableId
      ) {
        columnTasks = destinationColumnTasks;
      }

      // source column
      else if (section.id === source.droppableId) {
        columnTasks = sourceColumnTasks;
      }

      // destination column
      else if (section.id === destination.droppableId) {
        columnTasks = destinationColumnTasks;
      }

      // untouched columns
      else {
        columnTasks = updatedTasks
          .filter((task) => task.section_id === section.id)
          .sort((a, b) => a.position - b.position);
      }

      // assign fresh positions
      columnTasks.forEach((task, index) => {
        finalTasks.push({
          ...task,
          position: index,
        });
      });
    });

    // optimistic update
    setTasks(finalTasks);

    try {
      const payload = finalTasks.map((task) => ({
        id: task.id,
        section_id: task.section_id,
        status: task.status,
        position: task.position,
      }));

      console.table(payload);

      await TaskService.updateTaskPositions(payload);
    } catch (error) {
      console.error(error);

      await refreshBoard();
    }
  };
  // ===========================
  // Loading
  // ===========================

  if (loading) {
    return (
      <div
        className="
          flex h-[70vh] flex-col items-center
          justify-center gap-4
        "
      >
        <div
          className="
            h-14 w-14 animate-spin rounded-full
            border-4 border-slate-200 border-t-teal-500
          "
        />

        <p className="text-lg font-medium text-slate-500">Loading board...</p>
      </div>
    );
  }

  // ===========================
  // Empty State
  // ===========================

  if (sections.length === 0) {
    return (
      <div
        className="
          flex h-[70vh] flex-col items-center
          justify-center rounded-3xl border-2
          border-dashed border-slate-300
          bg-slate-50 px-6 text-center
        "
      >
        <div
          className="
            mb-5 flex h-20 w-20 items-center
            justify-center rounded-full
            bg-slate-200 text-3xl
          "
        >
          📋
        </div>

        <h2 className="text-3xl font-bold text-slate-700">No Sections Found</h2>

        <p className="mt-3 max-w-md text-slate-500">
          Create your first section to start organizing and managing project
          tasks.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Bar */}

      <div
        className="
          flex flex-col gap-5 rounded-3xl
          border border-slate-200 bg-white
          p-5 shadow-sm
          lg:flex-row lg:items-center
          lg:justify-between
        "
      >
        <div>
          <h2
            className="
              text-2xl font-bold text-slate-800
              sm:text-3xl
            "
          >
            Kanban Board
          </h2>

          <p className="mt-2 text-slate-500">
            Manage project tasks efficiently
          </p>
        </div>

        <button
          onClick={() => addTask(sections.length > 0 ? sections[0].id : "")}
          className="
            flex cursor-pointer items-center justify-center gap-2
            rounded-2xl bg-teal-600 px-5 py-3
            text-sm font-semibold text-white
            transition-all duration-200
            hover:bg-teal-700 hover:shadow-lg
            active:scale-95
          "
        >
          <Plus size={18} />
          New Task
        </button>
      </div>

      {/* Create Modal */}

      {createModalOpen && (
        <div
          className="
            fixed inset-0 z-50 flex items-center
            justify-center bg-black/50
            p-4 backdrop-blur-sm
          "
        >
          <div
            className="
              max-h-[95vh] w-full max-w-4xl
              overflow-y-auto rounded-3xl
              bg-white shadow-2xl
            "
          >
            <TaskForm
              projectId={projectId}
              task={null}
              users={users}
              sections={sections}
              defaultSectionId={selectedSectionId}
              onClose={closeCreateModal}
              onSuccess={handleTaskCreated}
            />
          </div>
        </div>
      )}

      {/* Drawer */}

      <TaskDrawer
        open={drawerOpen}
        taskId={selectedTaskId}
        projectId={projectId}
        users={users}
        sections={sections}
        onClose={closeDrawer}
        onRefresh={refreshBoard}
      />

      {/* Board */}

      <DragDropContext onDragEnd={handleDragEnd}>
        {/* MOBILE */}
        <div className="flex flex-col gap-5 lg:hidden">
          {sections.map((section) => {
            const sectionTasks = tasks
              .filter((task) => task.section_id === section.id)
              .sort((a, b) => a.position - b.position);

            return (
              <div key={section.id} className="w-full">
                <KanbanColumn
                  section={section}
                  tasks={sectionTasks}
                  users={users}
                  onTaskClick={openTask}
                  onAddTask={addTask}
                />
              </div>
            );
          })}
        </div>

        {/* DESKTOP */}
        <div
          className="
      hidden lg:flex
      gap-6
      overflow-x-auto
      overflow-y-hidden
      pb-4
    "
        >
          {sections.map((section) => {
            const sectionTasks = tasks
              .filter((task) => task.section_id === section.id)
              .sort((a, b) => a.position - b.position);

            return (
              <div
                key={section.id}
                className="
            min-w-[360px]
            max-w-[360px]
            flex-shrink-0
          "
              >
                <KanbanColumn
                  section={section}
                  tasks={sectionTasks}
                  users={users}
                  onTaskClick={openTask}
                  onAddTask={addTask}
                />
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Summary Cards */}

      <div
        className="
          grid grid-cols-1 gap-5
          sm:grid-cols-2 xl:grid-cols-4
        "
      >
        <div
          className="
            rounded-3xl border border-slate-200
            bg-white p-6 shadow-sm
          "
        >
          <h3 className="text-sm text-slate-500">Total Tasks</h3>

          <p
            className="
              mt-3 text-4xl font-bold
              text-slate-800
            "
          >
            {tasks.length}
          </p>
        </div>

        <div
          className="
            rounded-3xl border border-slate-200
            bg-white p-6 shadow-sm
          "
        >
          <h3 className="text-sm text-slate-500">Completed</h3>

          <p
            className="
              mt-3 text-4xl font-bold
              text-green-600
            "
          >
            {tasks.filter((task) => task.status === "completed").length}
          </p>
        </div>

        <div
          className="
            rounded-3xl border border-slate-200
            bg-white p-6 shadow-sm
          "
        >
          <h3 className="text-sm text-slate-500">In Progress</h3>

          <p
            className="
              mt-3 text-4xl font-bold
              text-orange-500
            "
          >
            {tasks.filter((task) => task.status === "in_progress").length}
          </p>
        </div>

        <div
          className="
            rounded-3xl border border-slate-200
            bg-white p-6 shadow-sm
          "
        >
          <h3 className="text-sm text-slate-500">Pending</h3>

          <p
            className="
              mt-3 text-4xl font-bold
              text-blue-600
            "
          >
            {tasks.filter((task) => task.status === "todo").length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default KanbanBoard;
