const processTag = (s: string) => s.replace(/[^a-zA-Z0-9_\-:./]/g, '_');

/**
 * https://docs.datadoghq.com/getting_started/tagging/#define-tags
 */
export const ddtags = (tags: Record<string, string>) =>
  Object.entries(tags)
    .filter(([key, value]) => key && value)
    .flatMap((entry) => {
      const [key, value] = entry.map((element) => processTag(element.trim()));

      return key && value ? `${key}:${value}` : [];
    })
    .join(',');
