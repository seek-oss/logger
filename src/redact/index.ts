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

const STARTS_WITH_INVALID_CHARS = '^[^$_a-zA-Z]';
const CONTAINS_INVALID_CHARS = '[^a-zA-Z0-9_$]+';
const nonStandardIdentifierRegex = new RegExp(
  `(${STARTS_WITH_INVALID_CHARS}|${CONTAINS_INVALID_CHARS})`,
);

export const keyFromPath = (paths: string[]): string => {
  const path = paths.reduce((previous, current) => {
    const dotDelimiter = previous === '' ? '' : '.';
    const escapedPath = nonStandardIdentifierRegex.test(current)
      ? `["${current}"]`
      : `${dotDelimiter}${current}`;
    return `${previous}${escapedPath}`;
  }, '');

  return path;
};

export const configureRedactCensor = (
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

  const redactMap = redactPaths.reduce(
    (previous, current) => ({ ...previous, [current]: true }),
    {} as Record<string, boolean>,
  );

  return redactPaths.length === 0
    ? { paths: removePaths, remove: true }
    : {
        paths: [...redactPaths, ...removePaths],
        censor: (_value, path) =>
          redactMap[keyFromPath(path)] ? '[Redacted]' : undefined,
      };
};
