// TODO: Redact cookies?
export const defaultRedact = [];

/**
 * Private interface vendored from `pino`
 */
interface redactOptions {
  paths: string[];
  censor?: string | ((value: unknown, path: string[]) => unknown);
  remove?: boolean;
}

export const addDefaultRedactPathStrings = (
  redact: string[] | redactOptions | undefined,
) => {
  if (!redact) {
    return defaultRedact;
  }
  if (Array.isArray(redact)) {
    return redact.concat(defaultRedact);
  }
  return redact;
};
