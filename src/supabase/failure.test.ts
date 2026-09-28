import { describe, expect, it } from "vitest";
import { describeFailure } from "./failure";

describe("saying what went wrong", () => {
    it("reads an ordinary Error", () => {
        expect(describeFailure(new Error("the collection was not a collection"))).toBe(
            "the collection was not a collection",
        );
    });

    it("reads a Supabase error, which is a plain object and not an Error", () => {
        // The reason this exists: String() on one of these gives "[object
        // Object]", which tells the cook nothing at the moment they need it.
        const postgrestError = {
            message: "Could not find the function public.collection",
            details: null,
            hint: null,
            code: "PGRST202",
        };

        expect(describeFailure(postgrestError)).toContain(
            "Could not find the function public.collection",
        );
        expect(describeFailure(postgrestError)).toContain("PGRST202");
    });

    it("adds the hint when the database offers one", () => {
        expect(
            describeFailure({ message: "no such column", hint: "did you mean saved_at?" }),
        ).toContain("did you mean saved_at?");
    });

    it("passes a plain string through", () => {
        expect(describeFailure("network down")).toBe("network down");
    });

    it("never returns [object Object], whatever it is handed", () => {
        for (const odd of [null, undefined, 42, {}, { code: "X" }, []]) {
            expect(describeFailure(odd)).not.toContain("[object Object]");
            expect(describeFailure(odd).length).toBeGreaterThan(0);
        }
    });
});
