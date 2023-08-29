import type * as pino from 'pino';

// TODO: Redact cookies?
export const defaultRedact = [];

export type ExtendedRedactOptions = pino.LoggerOptions['redact'] & {
  /**
   * A list of paths to remove from the logged object instead of redacting them.
   * Note that if you are only removing, rather use the `paths` property and set `remove` to `true`.
   */
  removePaths?: string[];
};

type ExtendedRedact = string[] | ExtendedRedactOptions | undefined;

export const addDefaultRedactPathStrings = (
  redact: ExtendedRedact,
): ExtendedRedact => {
  if (!redact) {
    return defaultRedact;
  }
  if (Array.isArray(redact)) {
    return redact.concat(defaultRedact);
  }
  return redact;
};

export const addRemovePathsCensor = (
  redact: ExtendedRedact,
): ExtendedRedact => {
  if (
    !redact ||
    Array.isArray(redact) ||
    !redact.removePaths ||
    redact.removePaths.length === 0
  ) {
    return redact;
  }

  const { paths: redactPaths, removePaths } = redact;

  return redactPaths.length === 0
    ? { paths: removePaths, remove: true }
    : {
        paths: [...redactPaths, ...removePaths],
        censor: (_value, path) =>
          redactPaths.includes(path.join('.')) ? '[Redacted]' : undefined,
      };
};
