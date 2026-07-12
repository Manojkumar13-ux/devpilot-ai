import { motion } from "framer-motion";

interface ReviewScoreGaugeProps {
  label: string;
  score: number;
  maxScore?: number;
  color?: string;
  icon?: React.ReactNode;
  size?: "sm" | "md";
}

export default function ReviewScoreGauge({
  label,
  score,
  maxScore = 10,
  color = "#8B5CF6",
  icon,
  size = "md",
}: ReviewScoreGaugeProps) {
  const pct = Math.round((Math.max(0, Math.min(score, maxScore)) / maxScore) * 100);
  const radius = size === "sm" ? 28 : 36;
  const stroke = size === "sm" ? 5 : 6;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-shrink-0">
        <svg width={radius * 2} height={radius * 2} className="transform -rotate-90">
          <circle
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={stroke}
          />
          <motion.circle
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {icon ? (
            <span className={size === "sm" ? "scale-75" : ""}>{icon}</span>
          ) : (
            <span className={`font-semibold ${size === "sm" ? "text-[10px]" : "text-xs"}`} style={{ color }}>
              {score}
            </span>
          )}
        </div>
      </div>
      <div className="min-w-0">
        <div className={`font-medium text-white/80 ${size === "sm" ? "text-[11px]" : "text-xs"}`}>{label}</div>
        <div className="text-[10px] text-white/40 mt-0.5">{score}/{maxScore}</div>
      </div>
    </div>
  );
}
