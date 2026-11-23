export function appendUniqueDirectories(
  existing: readonly string[],
  incoming: readonly string[],
): string[] {
  const result = [...existing];
  const seen = new Set(existing);
  for (const path of incoming) {
    if (!seen.has(path)) {
      seen.add(path);
      result.push(path);
    }
  }
  return result;
}

export function validateDirectories(
  paths: readonly string[],
  validateDirectory: (path: string) => Promise<string>,
): Promise<{ directories: string[]; errors: { path: string; error: unknown }[] }> {
  return Promise.allSettled(
    paths.map((path) => Promise.resolve().then(() => validateDirectory(path))),
  ).then((results) => {
    const directories: string[] = [];
    const errors: { path: string; error: unknown }[] = [];
    const seen = new Set<string>();

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        errors.push({ path: paths[index], error: result.reason });
      } else if (!seen.has(result.value)) {
        seen.add(result.value);
        directories.push(result.value);
      }
    });

    return { directories, errors };
  });
}
