import { IconButton } from "./IconButton";

export function Pagination({ total, limit, offset, onChange }) {
  const safeLimit = limit || 1;
  const page = Math.floor(offset / safeLimit) + 1;
  const pages = Math.max(1, Math.ceil(total / safeLimit));
  const start = total === 0 ? 0 : offset + 1;
  const end = Math.min(offset + safeLimit, total);

  return (
    <>
      <span className="page-info">
        {start}–{end} of {total}
      </span>
      <div className="pagination">
        <IconButton
          icon="chevron"
          label="Previous page"
          variant="secondary"
          size="sm"
          className="flip-x"
          disabled={page <= 1}
          onClick={() => onChange(Math.max(0, offset - safeLimit))}
        />
        <span className="page-info">
          Page {page} of {pages}
        </span>
        <IconButton
          icon="chevron"
          label="Next page"
          variant="secondary"
          size="sm"
          disabled={page >= pages}
          onClick={() => onChange(offset + safeLimit)}
        />
      </div>
    </>
  );
}
