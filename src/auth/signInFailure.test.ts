import { describe, expect, it } from "vitest";
import { REJECTED, UNREACHABLE, reasonForFailedSignIn } from "./signInFailure";

describe("explaining why a sign-in did not work", () => {
    it("blames the credentials when the server rejected them", () => {
        expect(reasonForFailedSignIn(400)).toBe(REJECTED);
        expect(reasonForFailedSignIn(401)).toBe(REJECTED);
        expect(reasonForFailedSignIn(422)).toBe(REJECTED);
    });

    it("blames the connection when the request never arrived", () => {
        expect(reasonForFailedSignIn(undefined)).toBe(UNREACHABLE);
        // Supabase gives a retryable fetch failure status 0, not a 4xx.
        expect(reasonForFailedSignIn(0)).toBe(UNREACHABLE);
    });

    it("does not ask the cook to re-type a password over a server fault", () => {
        expect(reasonForFailedSignIn(500)).toBe(UNREACHABLE);
        expect(reasonForFailedSignIn(503)).toBe(UNREACHABLE);
    });

    it("speaks Czech, like the rest of the collection", () => {
        expect(REJECTED).toMatch(/Přihlášení/);
        expect(UNREACHABLE).toMatch(/připojení/);
    });
});
