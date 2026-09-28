import { describe, expect, it } from "vitest";
import { isSecretKey } from "./keys";

/** A legacy key is a JWT whose payload names the role it grants. */
function legacyKeyFor(role: string): string {
    const payload = Buffer.from(JSON.stringify({ iss: "supabase", role })).toString("base64url");
    return `eyJhbGciOiJIUzI1NiJ9.${payload}.a-signature`;
}

describe("telling a secret Supabase key from a publishable one", () => {
    it("knows the new secret key by its prefix", () => {
        expect(isSecretKey("sb_secret_abc123")).toBe(true);
    });

    it("knows the new publishable key is not one", () => {
        expect(isSecretKey("sb_publishable_abc123")).toBe(false);
    });

    it("reads the role out of a legacy service_role key", () => {
        // The role is base64 inside the JWT, so a substring search for
        // "service_role" does not find it — which is exactly the key that must
        // never reach the browser.
        const key = legacyKeyFor("service_role");

        expect(key).not.toContain("service_role");
        expect(isSecretKey(key)).toBe(true);
    });

    it("reads the role out of a legacy anon key", () => {
        expect(isSecretKey(legacyKeyFor("anon"))).toBe(false);
    });

    it("treats anything it cannot read as not secret, rather than guessing", () => {
        expect(isSecretKey("")).toBe(false);
        expect(isSecretKey("eyJ-not-really-a-jwt")).toBe(false);
        expect(isSecretKey("some-opaque-string")).toBe(false);
    });
});
