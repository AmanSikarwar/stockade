import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { Combobox } from "./Combobox";

const items = [
  { id: "1", name: "Kraft mailer" },
  { id: "2", name: "Bubble wrap" },
];

describe("Combobox", () => {
  it("reports query changes as the user types", () => {
    const onQueryChange = vi.fn();
    render(<Combobox query="" onQueryChange={onQueryChange} items={items} onSelect={() => {}} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "kr" } });
    expect(onQueryChange).toHaveBeenCalledWith("kr");
  });

  it("opens the option list on focus and selects an item on click", () => {
    const onSelect = vi.fn();
    render(<Combobox query="" onQueryChange={() => {}} items={items} onSelect={onSelect} />);
    fireEvent.focus(screen.getByRole("combobox"));
    fireEvent.click(screen.getByRole("option", { name: "Bubble wrap" }));
    expect(onSelect).toHaveBeenCalledWith(items[1]);
  });

  it("shows the empty label when there are no items", () => {
    render(
      <Combobox
        query="zz"
        onQueryChange={() => {}}
        items={[]}
        onSelect={() => {}}
        emptyLabel="No products found"
      />,
    );
    fireEvent.focus(screen.getByRole("combobox"));
    expect(screen.getByText("No products found")).toBeInTheDocument();
  });
});
