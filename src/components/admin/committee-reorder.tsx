"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
import { reorderCommitteeAction } from "@/backend/features/committee/committee";

export function CommitteeReorder({
  sessionId,
  items,
}: {
  sessionId: string;
  items: { id: string; name: string; title: string }[];
}) {
  const [ids, setIds] = useState(items.map((item) => item.id));
  const [dragging, setDragging] = useState<string | null>(null);
  const byId = new Map(items.map((item) => [item.id, item]));

  const move = (index: number, delta: number) => {
    const next = [...ids];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setIds(next);
  };

  return (
    <form action={reorderCommitteeAction} className="rounded-xl border border-border bg-card p-4">
      <input type="hidden" name="sessionId" value={sessionId} />
      <input type="hidden" name="ids" value={JSON.stringify(ids)} />
      <p className="text-sm font-semibold">Panel order</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Drag a row or use the arrow buttons (keyboard friendly), then save.
      </p>
      <ul className="mt-3 space-y-2">
        {ids.map((id, index) => (
          <li
            key={id}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData("text/plain", id);
              setDragging(id);
            }}
            onDragEnd={() => setDragging(null)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const source = event.dataTransfer.getData("text/plain") || dragging;
              setDragging(null);
              if (!source || source === id) return;
              const next = ids.filter((entry) => entry !== source);
              next.splice(next.indexOf(id), 0, source);
              setIds(next);
            }}
            className={`flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm ${
              dragging === id ? "opacity-60" : ""
            }`}
          >
            <GripVertical aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate">
              <strong>{byId.get(id)?.name}</strong>
              <span className="ml-2 text-xs text-muted-foreground">{byId.get(id)?.title}</span>
            </span>
            <button
              type="button"
              onClick={() => move(index, -1)}
              aria-label={`Move ${byId.get(id)?.name} up`}
              className="rounded p-1 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ArrowUp aria-hidden="true" className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => move(index, 1)}
              aria-label={`Move ${byId.get(id)?.name} down`}
              className="rounded p-1 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ArrowDown aria-hidden="true" className="size-4" />
            </button>
          </li>
        ))}
      </ul>
      <button
        type="submit"
        className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Save order
      </button>
    </form>
  );
}
