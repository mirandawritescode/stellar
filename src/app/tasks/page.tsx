"use client";

import { useEffect, useState } from "react";
import { loadTasks, saveTasks, sortTasksForDisplay } from "@/lib/storage/tasks";
import { TASK_CATEGORY_LABELS } from "@/lib/types";
import type { Task, TaskCategory } from "@/lib/types";

const MAX_TITLE_LENGTH = 120;
const CATEGORIES = Object.keys(TASK_CATEGORY_LABELS) as TaskCategory[];

const fieldClass =
  "min-h-[44px] rounded-md border border-black/[.12] px-3 dark:border-white/[.18]";
const buttonClass =
  "min-h-[44px] rounded-md border border-black/[.12] px-3 text-sm font-medium dark:border-white/[.18]";

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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from localStorage, a browser-only external system unavailable during SSR
    setTasks(loadTasks(todayString()));
  }, []);

  if (tasks === undefined) return null;
  const taskList: Task[] = tasks;

  const ordered = sortTasksForDisplay(taskList, todayString());

  const titleValid = form !== null && form.title.trim().length > 0 && form.title.length <= MAX_TITLE_LENGTH;
  const categoryValid = form !== null && form.category !== "";
  const formValid = titleValid && categoryValid;

  function persist(next: Task[]) {
    saveTasks(next);
    setTasks(next);
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
    <div className="mx-auto flex max-w-[480px] flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Tasks</h1>
        {form === null && (
          <button type="button" onClick={openAddForm} className={buttonClass}>
            Add task
          </button>
        )}
      </div>

      {form !== null && (
        <section className="flex flex-col gap-3 rounded-md border border-black/[.12] p-4 dark:border-white/[.18]">
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
              <p className="text-sm text-red-600 dark:text-red-400">
                Enter a title (up to {MAX_TITLE_LENGTH} characters).
              </p>
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
            {touched && !categoryValid && (
              <p className="text-sm text-red-600 dark:text-red-400">Choose a category.</p>
            )}
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
            <button type="button" onClick={handleSubmit} className={buttonClass}>
              {form.id === null ? "Add" : "Save"}
            </button>
          </div>
        </section>
      )}

      {ordered.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No tasks yet. Add your first one to get started.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {ordered.map((task) => (
            <li
              key={task.id}
              className="flex items-center gap-1 rounded-md border border-black/[.12] px-1 py-1 dark:border-white/[.18]"
            >
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
                <span className={task.done ? "text-zinc-500 line-through dark:text-zinc-400" : ""}>
                  {task.title}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {TASK_CATEGORY_LABELS[task.category]}
                  {task.dueDate && ` · Due ${task.dueDate}`}
                </span>
              </button>

              {confirmDeleteId === task.id ? (
                <div className="flex flex-shrink-0 items-center gap-1 pr-1">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">Delete?</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(task.id)}
                    className="min-h-[44px] px-2 text-xs font-medium text-red-600 dark:text-red-400"
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(null)}
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
                  className="min-h-[44px] flex-shrink-0 px-2 text-xs text-zinc-500 dark:text-zinc-400"
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
