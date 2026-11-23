import { describe, expect, it, vi } from "vitest";
import { appendUniqueDirectories, validateDirectories } from "./setupDirectories";

describe("setup directory selection", () => {
  it("canonicalizes picker paths and keeps only the first copy in selection order", async () => {
    const validateDirectory = vi.fn(async (path: string) => {
      if (path === "/work/docs-alias") return "/work/docs";
      return path;
    });

    const { directories, errors } = await validateDirectories(
      ["/work/docs-alias", "/work/docs", "/work/photos", "/work/photos"],
      validateDirectory,
    );

    expect(directories).toEqual(["/work/docs", "/work/photos"]);
    expect(errors).toEqual([]);
    expect(appendUniqueDirectories(["/work/docs"], directories)).toEqual([
      "/work/docs",
      "/work/photos",
    ]);
    expect(validateDirectory).toHaveBeenCalledTimes(4);
  });

  it("keeps valid folders and reports failures from the same batch", async () => {
    const offlineError = new Error("offline");
    const validateDirectory = vi.fn(async (path: string) => {
      if (path === "/ejected") throw offlineError;
      if (path === "/work/docs-alias") return "/work/docs";
      return path;
    });

    const result = await validateDirectories(
      ["/ejected", "/work/docs-alias", "/work/docs"],
      validateDirectory,
    );

    expect(result.directories).toEqual(["/work/docs"]);
    expect(result.errors).toEqual([
      { path: "/ejected", error: offlineError },
    ]);
  });

  it("adds a valid new folder while preserving existing selections", () => {
    expect(appendUniqueDirectories(["/work/docs"], ["/work/photos"])).toEqual([
      "/work/docs",
      "/work/photos",
    ]);
  });
});
