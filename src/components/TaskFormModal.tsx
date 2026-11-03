"use client";

import { useState } from "react";
import ArchGlyph from "@/components/ArchGlyph";
import Modal from "@/components/Modal";
import { TASK_CATEGORY_LABELS } from "@/lib/types";
import type { Task, TaskCategory } from "@/lib/types";

const MAX_TITLE_LENGTH = 120;
const CATEGORIES = Object.keys(TASK_CATEGORY_LABELS) as TaskCategory[];

interface TaskFormModalProps {
  /** Omit to add a new task; pass an existing task to edit it. */
  task?: Task;
  onClose: () => void;
  onSave: (task: Task) => void;
}

export default function TaskFormModal({ task, onClose, onSave }: TaskFormModalProps) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [category, setCategory] = useState<TaskCategory | "">(task?.category ?? "");
  const [dueDate, setDueDate] = useState(task?.dueDate ?? "");
  const [touched, setTouched] = useState(false);

  const titleValid = title.trim().length > 0 && title.length <= MAX_TITLE_LENGTH;
  const categoryValid = category !== "";
  const formValid = titleValid && categoryValid;

  function handleSubmit() {
    setTouched(true);
    if (!formValid) return;

    const saved: Task = task
      ? { ...task, title: title.trim(), category: category as TaskCategory, dueDate: dueDate || undefined }
      : {
          id: crypto.randomUUID(),
          title: title.trim(),
          category: category as TaskCategory,
          dueDate: dueDate || undefined,
          done: false,
          createdAt: new Date().toISOString(),
        };
    onSave(saved);
  }

  return (
    <Modal onClose={onClose}>
      <section className="arch-card flex flex-col gap-3">
        <ArchGlyph />
        <h2 className="heading-display text-center text-lg">{task ? "Edit task" : "New task"}</h2>

        <div className="flex flex-col gap-1">
          <label htmlFor="task-title" className="text-sm font-medium">
            Title
          </label>
          <input
            id="task-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={MAX_TITLE_LENGTH}
            className="field"
          />
          {touched && !titleValid && (
            <p className="text-error text-sm">Enter a title (up to {MAX_TITLE_LENGTH} characters).</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="task-category" className="text-sm font-medium">
            Category
          </label>
          <select
            id="task-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as TaskCategory)}
            className="field"
          >
            <option value="">Choose a category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {TASK_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
          {touched && !categoryValid && <p className="text-error text-sm">Choose a category.</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="task-due" className="text-sm font-medium">
            Due date (optional)
          </label>
          <input
            id="task-due"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="field"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} className="btn btn-primary">
            {task ? "Save" : "Add"}
          </button>
        </div>
      </section>
    </Modal>
  );
}
