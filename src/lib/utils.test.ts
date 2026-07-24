import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn()", () => {
    it("returns a single class unchanged", () => {
        expect(cn("text-sm")).toBe("text-sm");
    });

    it("merges multiple classes", () => {
        expect(cn("text-sm", "font-bold")).toBe("text-sm font-bold");
    });

    it("deduplicates conflicting Tailwind classes (last wins)", () => {
        expect(cn("text-sm", "text-lg")).toBe("text-lg");
    });

    it("ignores falsy values", () => {
        expect(cn("text-sm", false, undefined, null as unknown as string)).toBe("text-sm");
    });

    it("handles conditional object syntax", () => {
        expect(cn("base", { "text-red-500": true, "text-blue-500": false })).toBe(
            "base text-red-500"
        );
    });
});
