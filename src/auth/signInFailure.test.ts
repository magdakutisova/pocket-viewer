import { describe, expect, it } from "vitest";
import { REJECTED, UNCONFIRMED, UNREACHABLE, reasonForFailedSignIn } from "./signInFailure";

describe("explaining why a sign-in did not work", () => {
    it("blames the credentials when the server rejected them", () => {
        expect(reasonForFailedSignIn({ status: 400, code: "invalid_credentials" })).toBe(REJECTED);
    });

    it("says so when the account was never confirmed", () => {
        expect(reasonForFailedSignIn({ status: 400, code: "email_not_confirmed" })).toBe(UNCONFIRMED);
    });

    it("blames the connection when the request never arrived", () => {
        expect(reasonForFailedSignIn({ status: undefined })).toBe(UNREACHABLE);
        // Supabase gives a retryable fetch failure status 0, not a 4xx.
        expect(reasonForFailedSignIn({ status: 0 })).toBe(UNREACHABLE);
    });

    it("does not ask the cook to re-type a password over a server fault", () => {
        expect(reasonForFailedSignIn({ status: 500 })).toBe(UNREACHABLE);
        expect(reasonForFailedSignIn({ status: 503 })).toBe(UNREACHABLE);
    });

    it("repeats what the server actually said when the fault is not the password", () => {
        // The misrouted-project-URL case: a 4xx that has nothing to do with
        // credentials. Blaming the password here sends you hunting for hours.
        const reason = reasonForFailedSignIn({
            status: 404,
            message: "Invalid path specified in request URL",
        });

        expect(reason).not.toBe(REJECTED);
        expect(reason).toContain("Invalid path specified in request URL");
    });

    it("still says something useful when an unexpected 4xx carries no message", () => {
        expect(reasonForFailedSignIn({ status: 418 })).not.toBe("");
    });

    it("speaks Czech, like the rest of the collection", () => {
        expect(REJECTED).toMatch(/Přihlášení/);
        expect(UNREACHABLE).toMatch(/připojení/);
        expect(UNCONFIRMED).toMatch(/potvrz/i);
    });
});
