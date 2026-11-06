import type { ScoreFactor } from "@/lib/planner/rank";

function formatPoints(points: number): string {
  return points > 0 ? `+${points}` : String(points);
}

interface PointsChipProps {
  score: number;
  factors: ScoreFactor[];
  /** A plain-language tier word (e.g. "Best", "Gentle") shown instead of the raw score. */
  label?: string;
  /** Renders the chip in a muted/outline style, for lower-priority tiers (e.g. "Gentle", "Open"). */
  muted?: boolean;
}

export default function PointsChip({ score, factors, label, muted }: PointsChipProps) {
  return (
    <span className="group relative mr-2 inline-flex" tabIndex={0}>
      <span className={muted ? "chip chip-muted" : "chip"}>{label ?? `PTS ${formatPoints(score)}`}</span>
      <div
        className="pts-popover pointer-events-none absolute right-0 bottom-full z-20 mb-2 w-56 opacity-0
          transition-opacity group-focus:opacity-100 group-hover:opacity-100"
      >
        {factors.length > 0 ? (
          <ul className="flex flex-col gap-1">
            {factors.map((f, i) => (
              <li key={i} className="text-xs">
                {f.reason}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted text-xs">No scoring factors today.</p>
        )}
      </div>
    </span>
  );
}
