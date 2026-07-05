import { useEffect, useState } from "react";
import { Send, Pencil, Trash2, Check, X } from "lucide-react";

import { supabase } from "../../components/supabase-client";
import ConfirmModal from "../modal/modal";

import type { TaskComment } from "./task";

interface TaskCommentsProps {
  taskId: string;
}

const TaskComments = ({ taskId }: TaskCommentsProps) => {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(true);

  const [comment, setComment] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  // Delete modal state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ===========================
  // Fetch current user
  // ===========================
  const fetchCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) setCurrentUserId(user.id);
  };

  // ===========================
  // Fetch comments
  // ===========================
  const fetchComments = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("task_comments")
      .select(
        `
        *,
        profiles:user_id (
          id,
          full_name
        )
      `
      )
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
    } else {
      setComments((data as TaskComment[]) || []);
    }

    setLoading(false);
  };

  // ===========================
  // Init + realtime
  // ===========================
  useEffect(() => {
    fetchCurrentUser();
    fetchComments();

    const channel = supabase
      .channel(`task-comments-${taskId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "task_comments",
          filter: `task_id=eq.${taskId}`,
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId]);

  // ===========================
  // Add comment (optimistic update)
  // ===========================
  const addComment = async () => {
    if (!comment.trim()) return;

    const { data, error } = await supabase
      .from("task_comments")
      .insert({
        task_id: taskId,
        user_id: currentUserId,
        comment: comment.trim(),
      })
      .select(
        `
        *,
        profiles:user_id (
          id,
          full_name
        )
      `
      )
      .single();

    if (error) {
      console.error(error);
      return;
    }

    setComments((prev) => [...prev, data]);
    setComment("");
  };

  // ===========================
  // Edit
  // ===========================
  const startEdit = (item: TaskComment) => {
    setEditingCommentId(item.id);
    setEditText(item.comment);
  };

  const cancelEdit = () => {
    setEditingCommentId(null);
    setEditText("");
  };

  const updateComment = async () => {
    if (!editingCommentId || !editText.trim()) return;

    const { data, error } = await supabase
      .from("task_comments")
      .update({
        comment: editText.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingCommentId)
      .select(
        `
        *,
        profiles:user_id (
          id,
          full_name
        )
      `
      )
      .single();

    if (error) {
      console.error(error);
      return;
    }

    setComments((prev) =>
      prev.map((c) => (c.id === editingCommentId ? data : c))
    );

    cancelEdit();
  };

  // ===========================
  // Delete (modal)
  // ===========================
  const confirmDelete = async () => {
    if (!deleteId) return;

    setDeleteLoading(true);

    const { error } = await supabase
      .from("task_comments")
      .delete()
      .eq("id", deleteId);

    setDeleteLoading(false);

    if (error) {
      console.error(error);
      return;
    }

    setComments((prev) => prev.filter((c) => c.id !== deleteId));
    setDeleteId(null);
  };

  const cancelDelete = () => {
    setDeleteId(null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <h3 className="text-lg font-semibold text-slate-800">Comments</h3>

      {/* Add comment */}
      <div className="flex gap-3">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Write a comment..."
          className="min-h-[90px] flex-1 rounded-2xl border border-slate-300 p-4 focus:border-teal-500 outline-none"
        />

        <button
          onClick={addComment}
          className="h-12 w-12 flex items-center justify-center rounded-2xl bg-teal-600 text-white hover:bg-teal-700 cursor-pointer"
        >
          <Send size={18} />
        </button>
      </div>

      {/* List */}
      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-slate-500">No comments yet</p>
      ) : (
        <div className="space-y-4">
          {comments.map((item) => {
            const isOwner = item.user_id === currentUserId;
            const isEditing = editingCommentId === item.id;

            return (
              <div key={item.id} className="p-4 rounded-2xl bg-slate-50 border">
                <div className="flex justify-between">
                  <div>
                    <p className="font-semibold text-slate-700">
                      {item.profiles?.full_name || "Unknown"}
                    </p>
                    <span className="text-xs text-slate-400">
                      {new Date(
                        item.updated_at || item.created_at
                      ).toLocaleString()}
                    </span>
                  </div>

                  {isOwner && !isEditing && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(item)}
                        className="p-2 hover:bg-slate-200 rounded cursor-pointer"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        onClick={() => setDeleteId(item.id)}
                        className="p-2 hover:bg-slate-200 rounded text-red-600 cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="mt-3 space-y-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full p-3 border rounded-xl"
                    />

                    <div className="flex gap-3">
                      <button
                        onClick={updateComment}
                        className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded"
                      >
                        <Check size={16} /> Save
                      </button>

                      <button
                        onClick={cancelEdit}
                        className="flex items-center gap-2 bg-slate-200 px-3 py-2 rounded"
                      >
                        <X size={16} /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-slate-700 text-sm">
                    {item.comment}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Comment"
        message="Are you sure you want to delete this comment?"
        confirmText="Delete"
        confirmColor="bg-red-600 hover:bg-red-700"
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
};

export default TaskComments;