const processTag = (s: string) => s.replace(/[^a-zA-Z0-9_\-:./]/g, '_');

/**
 * https://docs.datadoghq.com/getting_started/tagging/#define-tags
 */
export const ddtags = (tags: Record<string, string | undefined>) => {
  const entries = Object.entries(tags).flatMap((entry) => {
    const originalKey = entry[0]?.trim();
    const originalValue = entry[1]?.trim();

    if (!originalKey || !originalValue) {
      return [];
    }

    return [originalKey, originalValue].map(processTag).join(':');
  });

  return entries.length ? entries.join(',') : undefined;
};
