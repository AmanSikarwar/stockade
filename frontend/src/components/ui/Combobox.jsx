import { useEffect, useRef, useState } from "react";

import { Icon } from "../icons/Icon";

/**
 * Server-backed searchable select. The parent owns the query text and the
 * fetched items (so it can debounce and call the API), keeping this component
 * presentational. On select the parent typically sets the query to the chosen
 * item's label and records its id.
 */
export function Combobox({
  id,
  query,
  onQueryChange,
  items = [],
  loading = false,
  onSelect,
  getKey = (item) => item.id,
  getLabel = (item) => item.name,
  renderOption,
  placeholder = "Search…",
  emptyLabel = "No matches",
  disabled = false,
  required = false,
  invalid = false,
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef(null);

  useEffect(() => {
    function onDocMouseDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  useEffect(() => {
    setHighlight(0);
  }, [items]);

  function choose(item) {
    onSelect(item);
    setOpen(false);
  }

  function onKeyDown(event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setHighlight((value) => Math.min(value + 1, items.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((value) => Math.max(value - 1, 0));
    } else if (event.key === "Enter" && open && items[highlight]) {
      event.preventDefault();
      choose(items[highlight]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="combo" ref={rootRef}>
      <div className="input-affix">
        <span className="affix-icon">
          <Icon name="search" size={16} />
        </span>
        <input
          id={id}
          className={`input ${invalid ? "is-error" : ""}`.trim()}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          autoComplete="off"
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          value={query}
          onChange={(event) => {
            onQueryChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
      </div>
      {open ? (
        <div className="combo-menu" role="listbox">
          {loading ? (
            <div className="combo-status">Searching…</div>
          ) : items.length === 0 ? (
            <div className="combo-status">{emptyLabel}</div>
          ) : (
            items.map((item, index) => (
              <button
                key={getKey(item)}
                type="button"
                role="option"
                aria-selected={index === highlight}
                className={`combo-option ${index === highlight ? "on" : ""}`.trim()}
                onMouseEnter={() => setHighlight(index)}
                onClick={() => choose(item)}
              >
                {renderOption ? renderOption(item) : getLabel(item)}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
