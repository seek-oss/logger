const processTag = (s: string) => s.replace(/[^a-zA-Z0-9_\-:./]/g, '_');

/**
 * https://docs.datadoghq.com/getting_started/tagging/#define-tags
 */
export const ddtags = (tags: Record<string, string | undefined>) => {
  const entries = Object.entries(tags).flatMap((entry) => {
    const [key, value] = entry.map((element) =>
      processTag(element?.trim() ?? ''),
    );

    return key && value ? `${key}:${value}` : [];
  });

  return entries.length ? entries.join(',') : undefined;
};
