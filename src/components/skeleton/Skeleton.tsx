import type { CSSProperties } from "react";
import "./skeleton.css";

export type SkeletonSize =
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "label"
  | "value"
  | "title"
  | "meta"
  | "icon"
  | "pill"
  | "spark"
  | "bar"
  | "legend"
  | "action";

type SkeletonProps = {
  size?: SkeletonSize;
  className?: string;
  style?: CSSProperties;
  block?: boolean;
};

export function Skeleton({ size, className, style, block }: SkeletonProps) {
  const classes = ["b247-skel", size ? `is-${size}` : "", block ? "is-block" : "", className]
    .filter(Boolean)
    .join(" ");
  return <span className={classes} style={style} aria-hidden />;
}
