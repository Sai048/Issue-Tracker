// src/services/task.service.ts

import { supabase } from "../supabase-client";
import type { CreateTaskRequest, Task, UpdateTaskRequest } from "./task";

interface TaskPositionUpdate {
  id: string;
  section_id: string;
  status: string;
  position: number;
}

export class TaskService {
  // =========================
  // Fetch Tasks By Project
  // =========================
  static async getProjectTasks(projectId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from("tasks")
      .select(
        `
      *,
      sections (
        id,
        name,
        position
      )
    `,
      )
      .eq("project_id", projectId);

    if (error) throw error;

    const sortedTasks = (data || []).sort((a, b) => {
      const sectionA = a.sections?.position ?? 0;
      const sectionB = b.sections?.position ?? 0;

      // first sort by section order
      if (sectionA !== sectionB) {
        return sectionA - sectionB;
      }

      // then sort by task order inside section
      return a.position - b.position;
    });

    return sortedTasks as Task[];
  }

  // =========================
  // Fetch Single Task
  // =========================
  static async getTask(taskId: string): Promise<Task | null> {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .maybeSingle();

    if (error) throw error;

    return data as Task;
  }

  // =========================
  // Create Task
  // =========================
  static async createTask(payload: CreateTaskRequest): Promise<Task> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        ...payload,
        created_by: user?.id,
        updated_by: user?.id,
      })
      .select()
      .single();

    if (error) throw error;

    return data as Task;
  }

  // =========================
  // Update Task
  // =========================
  static async updateTask(
    taskId: string,
    payload: UpdateTaskRequest,
  ): Promise<Task> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("tasks")
      .update({
        ...payload,
        updated_by: user?.id,
      })
      .eq("id", taskId)
      .select()
      .maybeSingle();

    if (error) throw error;

    return data as Task;
  }

  // =========================
  // Delete Task
  // =========================
  static async deleteTask(taskId: string): Promise<void> {
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);

    if (error) throw error;
  }

  // =========================
  // Update Task Position
  // =========================
  static async moveTask(
    taskId: string,
    sectionId: string,
    position: number,
  ): Promise<void> {
    const { error } = await supabase
      .from("tasks")
      .update({
        section_id: sectionId,
        position,
      })
      .eq("id", taskId);

    if (error) throw error;
  }

  // =========================
  // Update Status
  // =========================
  static async updateStatus(taskId: string, status: string): Promise<void> {
    const { error } = await supabase
      .from("tasks")
      .update({
        status,
      })
      .eq("id", taskId);

    if (error) throw error;
  }

  // =========================
  // Assign User
  // =========================
  static async assignUser(
    taskId: string,
    userId: string | null,
  ): Promise<void> {
    const { error } = await supabase
      .from("tasks")
      .update({
        assigned_to: userId,
      })
      .eq("id", taskId);

    if (error) throw error;
  }

  // =========================
  // Update Priority
  // =========================
  static async updatePriority(taskId: string, priority: string): Promise<void> {
    const { error } = await supabase
      .from("tasks")
      .update({
        priority,
      })
      .eq("id", taskId);

    if (error) throw error;
  }

  // =========================
  // Update Dates
  // =========================
  static async updateDates(
    taskId: string,
    startDate: string | null,
    endDate: string | null,
    dueDate: string | null,
  ): Promise<void> {
    const { error } = await supabase
      .from("tasks")
      .update({
        start_date: startDate,
        end_date: endDate,
        due_date: dueDate,
      })
      .eq("id", taskId);

    if (error) throw error;
  }

  // =========================
  // Story Points
  // =========================
  static async updateStoryPoints(
    taskId: string,
    storyPoints: number,
  ): Promise<void> {
    const { error } = await supabase
      .from("tasks")
      .update({
        story_points: storyPoints,
      })
      .eq("id", taskId);

    if (error) throw error;
  }

  // =========================
  // Estimated Hours
  // =========================
  static async updateEstimatedHours(
    taskId: string,
    estimatedHours: number,
  ): Promise<void> {
    const { error } = await supabase
      .from("tasks")
      .update({
        estimated_hours: estimatedHours,
      })
      .eq("id", taskId);

    if (error) throw error;
  }

  // =========================
  // Archive Task
  // =========================
  static async archiveTask(taskId: string): Promise<void> {
    const { error } = await supabase
      .from("tasks")
      .update({
        archived: true,
      })
      .eq("id", taskId);

    if (error) throw error;
  }

  // =========================
  // Restore Task
  // =========================
  static async restoreTask(taskId: string): Promise<void> {
    const { error } = await supabase
      .from("tasks")
      .update({
        archived: false,
      })
      .eq("id", taskId);

    if (error) throw error;
  }

  // =========================
  // Complete Task
  // =========================
  static async completeTask(taskId: string): Promise<void> {
    const { error } = await supabase
      .from("tasks")
      .update({
        completed_at: new Date().toISOString(),
        status: "completed",
      })
      .eq("id", taskId);

    if (error) throw error;
  }

  static async updateTaskPositions(tasks: TaskPositionUpdate[]): Promise<void> {
    for (const task of tasks) {
      const { error } = await supabase
        .from("tasks")
        .update({
          section_id: task.section_id,
          status: task.status,
          position: task.position,
        })
        .eq("id", task.id);

      if (error) {
        console.error(error);
        throw error;
      }
    }
  }
}

export default TaskService;
