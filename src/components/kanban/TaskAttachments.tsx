import { useEffect, useState } from "react";

import {
  Upload,
  Trash2,
  Download,
  File,
  Pencil,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";

import {
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

import { Upload as S3Upload } from "@aws-sdk/lib-storage";

import { supabase } from "../../components/supabase-client";

import { s3 } from "./s3";

interface TaskAttachment {
  id: string;
  task_id: string;
  uploaded_by: string;
  file_name: string;
  file_url: string;
  file_type: string;
  created_at: string;
}

interface Props {
  taskId: string;
}

const TaskAttachments = ({ taskId }: Props) => {
  const [files, setFiles] = useState<TaskAttachment[]>([]);

  const [uploading, setUploading] = useState(false);

  const [deleting, setDeleting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [editedName, setEditedName] = useState("");

  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    file: TaskAttachment | null;
  }>({
    open: false,
    file: null,
  });

  // ===========================
  // Fetch Files
  // ===========================

  const fetchFiles = async () => {
    const { data, error } = await supabase
      .from("task_attachments")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(error);

      return;
    }

    setFiles((data as TaskAttachment[]) || []);
  };

  useEffect(() => {
    fetchFiles();
  }, [taskId]);

  // ===========================
  // Upload File
  // ===========================

  const uploadFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      setUploading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("User not authenticated");

        return;
      }

      const fileKey = `tasks/${taskId}/${Date.now()}-${file.name}`;

      const upload = new S3Upload({
        client: s3,

        params: {
          Bucket: import.meta.env.VITE_AWS_BUCKET_NAME,

          Key: fileKey,

          Body: file,

          ContentType: file.type,
        },
      });

      await upload.done();

      const fileUrl = `https://${import.meta.env.VITE_AWS_BUCKET_NAME}.s3.${import.meta.env.VITE_AWS_REGION}.amazonaws.com/${fileKey}`;

      const { error } = await supabase
        .from("task_attachments")
        .insert({
          task_id: taskId,

          uploaded_by: user.id,

          file_name: file.name,

          file_url: fileUrl,

          file_type: file.type,
        });

      if (error) {
        console.error(error);

        alert(error.message);

        return;
      }

      await fetchFiles();

      e.target.value = "";
    } catch (error) {
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  // ===========================
  // Open Delete Modal
  // ===========================

  const openDeleteModal = (
    file: TaskAttachment,
  ) => {
    setDeleteModal({
      open: true,
      file,
    });
  };

  // ===========================
  // Close Delete Modal
  // ===========================

  const closeDeleteModal = () => {
    setDeleteModal({
      open: false,
      file: null,
    });
  };

  // ===========================
  // Delete File
  // ===========================

  const deleteFile = async () => {
    if (!deleteModal.file) return;

    try {
      setDeleting(true);

      const file = deleteModal.file;

      // ===========================
      // Extract S3 Key
      // ===========================

      const bucketName =
        import.meta.env.VITE_AWS_BUCKET_NAME;

      const region =
        import.meta.env.VITE_AWS_REGION;

      const baseUrl = `https://${bucketName}.s3.${region}.amazonaws.com/`;

      const key = file.file_url.replace(
        baseUrl,
        "",
      );

      // ===========================
      // Delete From S3
      // ===========================

      await s3.send(
        new DeleteObjectCommand({
          Bucket: bucketName,

          Key: key,
        }),
      );

      // ===========================
      // Delete From DB
      // ===========================

      const { error } = await supabase
        .from("task_attachments")
        .delete()
        .eq("id", file.id);

      if (error) {
        console.error(error);

        return;
      }

      await fetchFiles();

      closeDeleteModal();
    } catch (error) {
      console.error(error);
    } finally {
      setDeleting(false);
    }
  };

  // ===========================
  // Edit File Name
  // ===========================

  const startEdit = (
    id: string,
    currentName: string,
  ) => {
    setEditingId(id);

    setEditedName(currentName);
  };

  const cancelEdit = () => {
    setEditingId(null);

    setEditedName("");
  };

  const saveEdit = async (id: string) => {
    if (!editedName.trim()) return;

    const { error } = await supabase
      .from("task_attachments")
      .update({
        file_name: editedName,
      })
      .eq("id", id);

    if (error) {
      console.error(error);

      return;
    }

    setEditingId(null);

    setEditedName("");

    await fetchFiles();
  };

  return (
    <>
      <div className="space-y-5">
        {/* Header */}

        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">
            Attachments
          </h3>

          <label
            className="
              flex cursor-pointer items-center gap-2
              rounded-xl bg-teal-600 px-4 py-2
              text-sm font-medium text-white
              transition hover:bg-teal-700
            "
          >
            <Upload size={16} />
            Upload

            <input
              type="file"
              className="hidden"
              onChange={uploadFile}
            />
          </label>
        </div>

        {/* Uploading */}

        {uploading && (
          <div className="text-sm text-slate-500">
            Uploading file...
          </div>
        )}

        {/* Empty */}

        {files.length === 0 ? (
          <div
            className="
              rounded-2xl border border-dashed
              border-slate-300 p-6 text-center
              text-sm text-slate-500
            "
          >
            No attachments yet
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="
                  flex items-center justify-between
                  rounded-2xl border border-slate-200
                  bg-slate-50 p-4
                "
              >
                {/* Left */}

                <div className="flex items-center gap-3">
                  <File size={18} />

                  <div>
                    {editingId === file.id ? (
                      <input
                        value={editedName}
                        onChange={(e) =>
                          setEditedName(
                            e.target.value,
                          )
                        }
                        className="
                          rounded-lg border
                          border-slate-300
                          px-3 py-1 text-sm
                          outline-none
                        "
                      />
                    ) : (
                      <p
                        className="
                          max-w-[220px] truncate
                          text-sm font-medium
                          text-slate-700
                        "
                      >
                        {file.file_name}
                      </p>
                    )}

                    <p className="text-xs text-slate-400">
                      {file.file_type}
                    </p>
                  </div>
                </div>

                {/* Actions */}

                <div className="flex items-center gap-2">
                  <a
                    href={file.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="
                      rounded-lg p-2 transition
                      hover:bg-slate-200
                    "
                  >
                    <Download size={18} />
                  </a>

                  {editingId === file.id ? (
                    <>
                      <button
                        onClick={() =>
                          saveEdit(file.id)
                        }
                        className="
                          rounded-lg p-2 transition
                          hover:bg-green-100
                          hover:text-green-700
                        "
                      >
                        <Check size={18} />
                      </button>

                      <button
                        onClick={cancelEdit}
                        className="
                          rounded-lg p-2 transition
                          hover:bg-slate-200
                        "
                      >
                        <X size={18} />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() =>
                        startEdit(
                          file.id,
                          file.file_name,
                        )
                      }
                      className="
                        rounded-lg p-2 transition
                        hover:bg-slate-200
                      "
                    >
                      <Pencil size={18} />
                    </button>
                  )}

                  <button
                    onClick={() =>
                      openDeleteModal(file)
                    }
                    className="
                      rounded-lg p-2 transition
                      hover:bg-red-100
                      hover:text-red-600
                    "
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Modal */}

      {deleteModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div
                className="
                  flex h-12 w-12 items-center
                  justify-center rounded-2xl
                  bg-red-100 text-red-600
                "
              >
                <AlertTriangle size={24} />
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-800">
                  Delete Attachment
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Are you sure you want to
                  delete this attachment?
                  This action cannot be
                  undone.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeDeleteModal}
                className="
                  rounded-xl border
                  border-slate-300 px-5 py-2.5
                  text-sm font-medium text-slate-700
                  transition hover:bg-slate-100
                "
              >
                Cancel
              </button>

              <button
                onClick={deleteFile}
                disabled={deleting}
                className="
                  rounded-xl bg-red-600
                  px-5 py-2.5 text-sm
                  font-medium text-white
                  transition hover:bg-red-700
                  disabled:opacity-50
                "
              >
                {deleting
                  ? "Deleting..."
                  : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TaskAttachments;