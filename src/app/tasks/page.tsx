"use client";

import { useEffect, useState } from "react";
import ArchGlyph from "@/components/ArchGlyph";
import { loadTasks, saveTasks, sortTasksForDisplay } from "@/lib/storage/tasks";
import { TASK_CATEGORY_LABELS } from "@/lib/types";
import type { Task, TaskCategory } from "@/lib/types";

const MAX_TITLE_LENGTH = 120;
const CATEGORIES = Object.keys(TASK_CATEGORY_LABELS) as TaskCategory[];

const fieldClass = "field";
const buttonClass = "btn";

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

interface FormState {
  id: string | null;
  title: string;
  category: TaskCategory | "";
  dueDate: string;
}

const EMPTY_FORM: FormState = { id: null, title: "", category: "", dueDate: "" };

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[] | undefined>(undefined);
  const [form, setForm] = useState<FormState | null>(null);
  const [touched, setTouched] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from localStorage, a browser-only external system unavailable during SSR
    setTasks(loadTasks(todayString()));
  }, []);

  if (tasks === undefined) {
    return (
      <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-4 p-6">
        <p className="text-muted text-sm">Loading...</p>
      </div>
    );
  }
  const taskList: Task[] = tasks;

  const ordered = sortTasksForDisplay(taskList, todayString());

  const titleValid = form !== null && form.title.trim().length > 0 && form.title.length <= MAX_TITLE_LENGTH;
  const categoryValid = form !== null && form.category !== "";
  const formValid = titleValid && categoryValid;

  function persist(next: Task[]) {
    try {
      saveTasks(next);
      setTasks(next);
      setSaveError(null);
    } catch {
      setSaveError("Couldn't save your changes. Your browser's storage might be full or unavailable.");
    }
  }

  function openAddForm() {
    setForm(EMPTY_FORM);
    setTouched(false);
  }

  function openEditForm(task: Task) {
    setForm({ id: task.id, title: task.title, category: task.category, dueDate: task.dueDate ?? "" });
    setTouched(false);
  }

  function closeForm() {
    setForm(null);
    setTouched(false);
  }

  function handleSubmit() {
    setTouched(true);
    if (!form || !formValid) return;

    if (form.id === null) {
      const newTask: Task = {
        id: crypto.randomUUID(),
        title: form.title.trim(),
        category: form.category as TaskCategory,
        dueDate: form.dueDate || undefined,
        done: false,
        createdAt: new Date().toISOString(),
      };
      persist([...taskList, newTask]);
    } else {
      const next = taskList.map((t) =>
        t.id === form.id
          ? {
              ...t,
              title: form.title.trim(),
              category: form.category as TaskCategory,
              dueDate: form.dueDate || undefined,
            }
          : t,
      );
      persist(next);
    }
    closeForm();
  }

  function handleToggleDone(task: Task) {
    const willBeDone = !task.done;
    const next = taskList.map((t) =>
      t.id === task.id
        ? { ...t, done: willBeDone, completedAt: willBeDone ? new Date().toISOString() : undefined }
        : t,
    );
    persist(next);
  }

  function handleDelete(id: string) {
    persist(taskList.filter((t) => t.id !== id));
    setConfirmDeleteId(null);
  }

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="heading-display text-lg">Tasks</h1>
        {form === null && (
          <button type="button" onClick={openAddForm} className={`${buttonClass} btn-primary`}>
            Add task
          </button>
        )}
      </div>

      {saveError && <p className="text-error text-sm">{saveError}</p>}

      {form !== null && (
        <section className="arch-card flex flex-col gap-3">
          <ArchGlyph />
          <h2 className="heading-display text-center text-lg">{form.id === null ? "New task" : "Edit task"}</h2>
          <div className="flex flex-col gap-1">
            <label htmlFor="task-title" className="text-sm font-medium">
              Title
            </label>
            <input
              id="task-title"
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              maxLength={MAX_TITLE_LENGTH}
              className={fieldClass}
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
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as TaskCategory })}
              className={fieldClass}
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
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className={fieldClass}
            />
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={closeForm} className={buttonClass}>
              Cancel
            </button>
            <button type="button" onClick={handleSubmit} className={`${buttonClass} btn-primary`}>
              {form.id === null ? "Add" : "Save"}
            </button>
          </div>
        </section>
      )}

      {ordered.length === 0 ? (
        <p className="text-muted text-sm">No tasks yet. Add your first one to get started.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {ordered.map((task) => (
            <li key={task.id} className="glass-card flex items-center gap-1 px-1 py-1">
              <label className="flex h-11 w-11 flex-shrink-0 items-center justify-center">
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => handleToggleDone(task)}
                  className="h-5 w-5"
                  aria-label={task.done ? `Mark "${task.title}" not done` : `Mark "${task.title}" done`}
                />
              </label>

              <button
                type="button"
                onClick={() => openEditForm(task)}
                className="flex min-h-[44px] flex-1 flex-col items-start justify-center text-left"
              >
                <span className={`text-sm ${task.done ? "text-muted line-through" : ""}`}>{task.title}</span>
                <span className="text-muted text-xs">
                  {TASK_CATEGORY_LABELS[task.category]}
                  {task.dueDate && ` · Due ${task.dueDate}`}
                </span>
              </button>

              {confirmDeleteId === task.id ? (
                <div className="flex flex-shrink-0 items-center gap-1 pr-1">
                  <span className="text-muted text-xs">Delete?</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(task.id)}
                    aria-label={`Yes, delete "${task.title}"`}
                    className="text-error min-h-[44px] px-2 text-xs font-medium"
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(null)}
                    aria-label={`No, keep "${task.title}"`}
                    className="min-h-[44px] px-2 text-xs font-medium"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(task.id)}
                  aria-label={`Delete "${task.title}"`}
                  className="text-muted min-h-[44px] flex-shrink-0 px-2 text-xs"
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
