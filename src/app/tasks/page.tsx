"use client";

import { useEffect, useState } from "react";
import PointsChip from "@/components/PointsChip";
import TaskFormModal from "@/components/TaskFormModal";
import { computeNatalChart } from "@/lib/astro/natal";
import { computeDayThemes } from "@/lib/astro/themes";
import { computeTransits, localNoonToday } from "@/lib/astro/transits";
import { rankTasks } from "@/lib/planner/rank";
import { loadBirthData } from "@/lib/storage/birthData";
import { loadTasks, recentlyCompletedTasks, saveTasks, sortTasksForDisplay } from "@/lib/storage/tasks";
import { TASK_CATEGORY_LABELS } from "@/lib/types";
import type { BirthData, Task } from "@/lib/types";

type SortBy = "due" | "points";

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function TasksPage() {
  const [birthData, setBirthData] = useState<BirthData | null | undefined>(undefined);
  const [tasks, setTasks] = useState<Task[] | undefined>(undefined);
  // "new" opens the form for adding a task; a Task opens it pre-filled for editing.
  const [formTarget, setFormTarget] = useState<"new" | Task | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>("due");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from localStorage, a browser-only external system unavailable during SSR
    setBirthData(loadBirthData());
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from localStorage, a browser-only external system unavailable during SSR
    setTasks(loadTasks(todayString()));
  }, []);

  if (tasks === undefined || birthData === undefined) {
    return (
      <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-4 p-6">
        <p className="text-muted text-sm">Loading...</p>
      </div>
    );
  }
  const taskList: Task[] = tasks;

  const natalChart = birthData ? computeNatalChart(birthData) : null;
  const transits = natalChart ? computeTransits(natalChart, localNoonToday()) : null;
  const dayThemes = transits ? computeDayThemes(transits) : null;

  const ranked = dayThemes ? rankTasks(taskList, dayThemes, todayString()) : [];
  const rankedById = new Map(ranked.map((r) => [r.task.id, r]));

  const ordered =
    sortBy === "points" && dayThemes
      ? [...ranked.map((r) => r.task), ...recentlyCompletedTasks(taskList, todayString())]
      : sortTasksForDisplay(taskList, todayString());

  function persist(next: Task[]) {
    try {
      saveTasks(next);
      setTasks(next);
      setSaveError(null);
    } catch {
      setSaveError("Couldn't save your changes. Your browser's storage might be full or unavailable.");
    }
  }

  function handleSaveTask(task: Task) {
    if (formTarget === "new") {
      persist([...taskList, task]);
    } else {
      persist(taskList.map((t) => (t.id === task.id ? task : t)));
    }
    setFormTarget(null);
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
      <div className="relative flex items-center justify-end">
        <h1 className="heading-display absolute inset-x-0 text-center text-lg">Tasks</h1>
        <button type="button" onClick={() => setFormTarget("new")} className="btn btn-primary">
          Add task
        </button>
      </div>

      {dayThemes && (
        <div className="flex items-center gap-3">
          <span className="section-label">Sort by</span>
          <div className="window-picker max-w-[220px]">
            <button
              type="button"
              onClick={() => setSortBy("due")}
              aria-pressed={sortBy === "due"}
              className={`window-pill ${sortBy === "due" ? "selected" : ""}`}
            >
              Due date
            </button>
            <button
              type="button"
              onClick={() => setSortBy("points")}
              aria-pressed={sortBy === "points"}
              className={`window-pill ${sortBy === "points" ? "selected" : ""}`}
            >
              Points
            </button>
          </div>
        </div>
      )}

      {saveError && <p className="text-error text-sm">{saveError}</p>}

      {formTarget !== null && (
        <TaskFormModal
          task={formTarget === "new" ? undefined : formTarget}
          onClose={() => setFormTarget(null)}
          onSave={handleSaveTask}
        />
      )}

      {ordered.length === 0 ? (
        <p className="text-muted text-sm">No tasks yet. Add your first one to get started.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {ordered.map((task) => {
            const rankedTask = rankedById.get(task.id);
            const showingDeleteConfirm = confirmDeleteId === task.id;
            return (
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
                  onClick={() => setFormTarget(task)}
                  className="flex min-h-[44px] flex-1 flex-col items-start justify-center text-left"
                >
                  <span className={`text-sm ${task.done ? "text-muted line-through" : ""}`}>{task.title}</span>
                  <span className="text-muted text-xs">
                    {TASK_CATEGORY_LABELS[task.category]}
                    {task.dueDate && ` · Due ${task.dueDate}`}
                  </span>
                </button>

                {rankedTask && !showingDeleteConfirm && (
                  <PointsChip score={rankedTask.score} factors={rankedTask.factors} />
                )}

                {showingDeleteConfirm ? (
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
            );
          })}
        </ul>
      )}
    </div>
  );
}
