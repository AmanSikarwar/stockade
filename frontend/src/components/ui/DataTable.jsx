import { EmptySearch } from "../illustrations/Illustrations";
import { Icon } from "../icons/Icon";

function SortableHeader({ column, sort, onSort }) {
  const sortKey = column.sortKey ?? column.key;
  const active = sort?.by === sortKey;
  const dir = active ? sort.dir : null;
  return (
    <th scope="col" className={`sortable ${column.align === "right" ? "t-right" : ""}`.trim()}>
      <button type="button" className="th-in" onClick={() => onSort(sortKey)}>
        {column.header}
        <span className={`sort-ico ${active ? "active" : ""}`.trim()}>
          <Icon
            name="chevron"
            size={13}
            stroke={2.2}
            className={dir === "asc" ? "rot-up" : "rot-down"}
          />
        </span>
      </button>
    </th>
  );
}

export function DataTable({
  columns,
  rows,
  emptyMessage = "No records found.",
  empty,
  sort,
  onSort,
}) {
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
            {columns.map((column) =>
              column.sortable && onSort ? (
                <SortableHeader key={column.key} column={column} sort={sort} onSort={onSort} />
              ) : (
                <th
                  key={column.key}
                  scope="col"
                  className={column.align === "right" ? "t-right" : undefined}
                >
                  {column.header}
                </th>
              ),
            )}
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
