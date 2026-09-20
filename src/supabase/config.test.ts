import { describe, expect, it } from "vitest";
import { readSupabaseConfig } from "./config";

describe("reading Supabase credentials from environment configuration", () => {
    it("returns the project url and publishable key", () => {
        const config = readSupabaseConfig({
            VITE_SUPABASE_URL: "https://abcdefgh.supabase.co",
            VITE_SUPABASE_ANON_KEY: "a-publishable-key",
        });

        expect(config).toEqual({
            url: "https://abcdefgh.supabase.co",
            anonKey: "a-publishable-key",
        });
    });

    it("ignores surrounding whitespace, which .env files collect", () => {
        const config = readSupabaseConfig({
            VITE_SUPABASE_URL: "  https://abcdefgh.supabase.co  ",
            VITE_SUPABASE_ANON_KEY: "\ta-publishable-key\n",
        });

        expect(config).toEqual({
            url: "https://abcdefgh.supabase.co",
            anonKey: "a-publishable-key",
        });
    });

    it("names the missing variable rather than building a broken client", () => {
        expect(() =>
            readSupabaseConfig({ VITE_SUPABASE_ANON_KEY: "a-publishable-key" }),
        ).toThrowError(/VITE_SUPABASE_URL/);

        expect(() =>
            readSupabaseConfig({ VITE_SUPABASE_URL: "https://abcdefgh.supabase.co" }),
        ).toThrowError(/VITE_SUPABASE_ANON_KEY/);
    });

    it("treats a blank value as missing", () => {
        expect(() =>
            readSupabaseConfig({
                VITE_SUPABASE_URL: "   ",
                VITE_SUPABASE_ANON_KEY: "a-publishable-key",
            }),
        ).toThrowError(/VITE_SUPABASE_URL/);
    });

    it("reports both missing variables together, so one run of the app fixes both", () => {
        expect(() => readSupabaseConfig({})).toThrowError(
            /VITE_SUPABASE_URL.*VITE_SUPABASE_ANON_KEY/s,
        );
    });

    it("rejects a service-role key, which must never reach the browser", () => {
        expect(() =>
            readSupabaseConfig({
                VITE_SUPABASE_URL: "https://abcdefgh.supabase.co",
                VITE_SUPABASE_ANON_KEY: "sb_secret_abc123",
            }),
        ).toThrowError(/secret/i);
    });
});
