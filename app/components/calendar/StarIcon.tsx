interface StarIconProps {
  className: string;
  filled?: boolean;
  outlined?: boolean;
}

export function StarIcon({ className, filled = false, outlined = true }: StarIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke={outlined ? "currentColor" : "none"}
      strokeWidth={2}
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
