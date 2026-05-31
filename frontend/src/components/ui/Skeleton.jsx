export function Skeleton({ width = "100%", height = 12, radius, className = "", style }) {
  return (
    <span
      className={`skeleton ${className}`.trim()}
      style={{ display: "block", width, height, borderRadius: radius, ...style }}
    />
  );
}

/**
 * Loading placeholder for DataTable — reuses the same `columns` array so the
 * header row matches the real table while the body shimmers.
 */
export function TableSkeleton({ columns, rows = 6 }) {
  return (
    <div className="tbl-wrap">
      <table className="tbl">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={column.align === "right" ? "t-right" : undefined}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((column, columnIndex) => (
                <td key={column.key} className={column.align === "right" ? "t-right" : undefined}>
                  <Skeleton
                    width={columnIndex === 0 ? "70%" : column.align === "right" ? "42%" : "55%"}
                    height={12}
                    style={column.align === "right" ? { marginLeft: "auto" } : undefined}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
