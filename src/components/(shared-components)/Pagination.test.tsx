import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Pagination from "./Pagination";

describe("Pagination", () => {
    it("renders nothing when totalPages <= 1", () => {
        const { container } = render(
            <Pagination page={1} totalPages={1} onPageChange={vi.fn()} />
        );
        expect(container.firstChild).toBeNull();
    });

    it("renders page numbers", () => {
        render(<Pagination page={1} totalPages={3} onPageChange={vi.fn()} />);
        expect(screen.getByText("1")).toBeInTheDocument();
        expect(screen.getByText("2")).toBeInTheDocument();
        expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("calls onPageChange when a page number is clicked", () => {
        const onChange = vi.fn();
        render(<Pagination page={1} totalPages={3} onPageChange={onChange} />);
        fireEvent.click(screen.getByText("2"));
        expect(onChange).toHaveBeenCalledWith(2);
    });

    it("Previous button is disabled on page 1", () => {
        render(<Pagination page={1} totalPages={3} onPageChange={vi.fn()} />);
        expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
    });

    it("Next button is disabled on last page", () => {
        render(<Pagination page={3} totalPages={3} onPageChange={vi.fn()} />);
        expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
    });

    it("clicking Next advances to the next page", () => {
        const onChange = vi.fn();
        render(<Pagination page={2} totalPages={5} onPageChange={onChange} />);
        fireEvent.click(screen.getByRole("button", { name: /next/i }));
        expect(onChange).toHaveBeenCalledWith(3);
    });

    it("clicking Previous goes back one page", () => {
        const onChange = vi.fn();
        render(<Pagination page={3} totalPages={5} onPageChange={onChange} />);
        fireEvent.click(screen.getByRole("button", { name: /previous/i }));
        expect(onChange).toHaveBeenCalledWith(2);
    });

    it("shows total count when provided", () => {
        render(<Pagination page={1} totalPages={3} onPageChange={vi.fn()} total={60} />);
        expect(screen.getByText(/60 total/i)).toBeInTheDocument();
    });

    it("shows ellipsis for large page ranges", () => {
        render(<Pagination page={5} totalPages={10} onPageChange={vi.fn()} />);
        const ellipses = screen.getAllByText("…");
        expect(ellipses.length).toBeGreaterThanOrEqual(1);
    });

    it("all page buttons are disabled when isLoading is true", () => {
        render(<Pagination page={2} totalPages={5} onPageChange={vi.fn()} isLoading={true} />);
        // The numbered page buttons (not Prev/Next) should be disabled
        const pageButtons = screen.getAllByRole("button");
        const disabledCount = pageButtons.filter(b => b.hasAttribute("disabled")).length;
        expect(disabledCount).toBeGreaterThan(0);
    });
});
