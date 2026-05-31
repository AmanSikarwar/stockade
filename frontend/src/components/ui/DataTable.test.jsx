import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { DataTable } from "./DataTable";

const columns = [
  { header: "Name", key: "name", sortable: true },
  { header: "Qty", key: "qty", align: "right" },
];
const rows = [
  { id: "1", name: "Tape", qty: 8 },
  { id: "2", name: "Box", qty: 3 },
];

describe("DataTable", () => {
  it("renders a row per record", () => {
    render(<DataTable columns={columns} rows={rows} />);
    expect(screen.getByText("Tape")).toBeInTheDocument();
    expect(screen.getByText("Box")).toBeInTheDocument();
  });

  it("shows the empty message when there are no rows", () => {
    render(<DataTable columns={columns} rows={[]} emptyMessage="Nothing here" />);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });

  it("labels cells with their column header for the mobile card stack", () => {
    render(<DataTable columns={columns} rows={rows} />);
    const qtyCell = screen.getByText("8").closest("td");
    expect(qtyCell).toHaveAttribute("data-label", "Qty");
  });

  it("calls onSort with the column key when a sortable header is clicked", () => {
    const onSort = vi.fn();
    render(
      <DataTable columns={columns} rows={rows} sort={{ by: "name", dir: "asc" }} onSort={onSort} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Name" }));
    expect(onSort).toHaveBeenCalledWith("name");
  });
});
