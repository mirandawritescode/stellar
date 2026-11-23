interface SkeletonProps {
  className?: string;
}

/** A pulsing placeholder block, sized by the Tailwind classes passed in. */
export default function Skeleton({ className = "" }: SkeletonProps) {
  return <div aria-hidden="true" className={`skeleton ${className}`} />;
}
