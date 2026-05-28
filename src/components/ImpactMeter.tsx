interface ImpactMeterProps {
  score: number;
  accent: string;
}

/** A compact 10-segment bar visualizing an event's 1-10 impact score. */
export default function ImpactMeter({ score, accent }: ImpactMeterProps) {
  const filled = Math.round(score);
  return (
    <div className="flex items-center gap-0.5" aria-label={`Impact ${score} of 10`}>
      {Array.from({ length: 10 }).map((_, i) => (
        <span
          key={i}
          className="h-3 w-1 rounded-full"
          style={{ backgroundColor: i < filled ? accent : "#e7e4df" }}
        />
      ))}
    </div>
  );
}
