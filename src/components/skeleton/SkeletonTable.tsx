import { Skeleton, type SkeletonSize } from "./Skeleton";

export type SkeletonTableCell = SkeletonSize | "name";

type SkeletonTableBodyProps = {
  rows?: number;
  columns: SkeletonTableCell[];
  rowClassName?: string;
};

export function SkeletonTableBody({ rows = 5, columns, rowClassName = "b247-skel-row" }: SkeletonTableBodyProps) {
  return (
    <>
      {Array.from({ length: rows }, (_, i) => (
        <tr key={`sk-row-${i}`} className={rowClassName}>
          {columns.map((col, j) => (
            <td key={`sk-cell-${i}-${j}`}>
              {col === "name" ? (
                <div className="b247-skel-name">
                  <Skeleton size="sm" block />
                  <Skeleton size="xs" block />
                </div>
              ) : (
                <Skeleton size={col} />
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
