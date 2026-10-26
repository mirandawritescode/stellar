"use client";

import { useEffect, useState } from "react";
import { loadTasks, sortTasksForDisplay } from "@/lib/storage/tasks";
import { TASK_CATEGORY_LABELS } from "@/lib/types";
import type { Task } from "@/lib/types";

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[] | undefined>(undefined);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from localStorage, a browser-only external system unavailable during SSR
    setTasks(loadTasks(todayString()));
  }, []);

  if (tasks === undefined) return null;

  const ordered = sortTasksForDisplay(tasks, todayString());

  return (
    <div className="mx-auto flex max-w-[480px] flex-1 flex-col gap-4 p-6">
      <h1 className="text-lg font-semibold">Tasks</h1>

      {ordered.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No tasks yet. Add your first one to get started.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {ordered.map((task) => (
            <li
              key={task.id}
              className="flex items-center justify-between gap-2 rounded-md border border-black/[.12] px-3 py-2 dark:border-white/[.18]"
            >
              <div className="flex flex-col">
                <span className={task.done ? "text-zinc-500 line-through dark:text-zinc-400" : ""}>
                  {task.title}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {TASK_CATEGORY_LABELS[task.category]}
                  {task.dueDate && ` · Due ${task.dueDate}`}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
