interface RingProgressProps {
  completed: number;
  total: number;
  percent: number;
  size?: number;
}

export default function RingProgress({
  completed,
  total,
  percent,
  size = 100,
}: RingProgressProps) {
  const strokeWidth = 9;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(percent, 100) / 100);

  return (
    <div className="flex flex-col items-center gap-1.5 shrink-0">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: "rotate(-90deg)" }}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            stroke="currentColor"
            className="text-border"
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            stroke="currentColor"
            className="text-accent transition-all duration-500"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-text-1 leading-none">
            {completed}/{total}
          </span>
        </div>
      </div>
      <p className="text-[11px] text-text-3 text-center">Dzisiejsze nawyki</p>
    </div>
  );
}