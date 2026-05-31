import { EmptySearch } from "../illustrations/Illustrations";

export function DataTable({ columns, rows, emptyMessage = "No records found.", empty }) {
  if (!rows?.length) {
    return (
      empty ?? (
        <div className="empty-state">
          <EmptySearch />
          <p>{emptyMessage}</p>
        </div>
      )
    );
  }

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
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((column) => {
                const cellClass = [column.align === "right" ? "t-right" : "", column.cellClassName]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <td key={column.key} className={cellClass || undefined}>
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
