import type * as pino from 'pino';

// TODO: Redact cookies?
export const defaultRedact = [];

export const defaultRemovePaths: string[] = [];

type redactOptions = Extract<pino.LoggerOptions['redact'], { paths: string[] }>;

type extendedRedactOptions = redactOptions & {
  /**
   * A list of paths to remove from the logged object instead of redacting them.
   * Note that if you are only removing, rather use the `paths` property and set `remove` to `true`.
   */
  removePaths?: string[];

  /**
   * When `true`, the `defaultRemovePaths` will not be appended to the `removePaths` list.
   */
  ignoreDefaultRemovePaths?: true;
};

export type ExtendedRedact = string[] | extendedRedactOptions | undefined;

const appendDefaultRedactAndRemove = (
  redact: ExtendedRedact,
): extendedRedactOptions | undefined => {
  const inputRedact =
    typeof redact !== 'undefined' && !Array.isArray(redact)
      ? redact
      : { paths: redact ?? [] };

  const paths = inputRedact.paths.concat(defaultRedact);
  const inputRemovePaths = inputRedact.removePaths ?? [];
  const removePaths = inputRedact.ignoreDefaultRemovePaths
    ? inputRemovePaths
    : inputRemovePaths.concat(defaultRemovePaths);

  return paths.length === 0 && removePaths.length === 0
    ? undefined
    : { ...inputRedact, paths, removePaths };
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

const configureRedactCensor = (redact: ExtendedRedact): ExtendedRedact => {
  if (
    !redact ||
    Array.isArray(redact) ||
    !redact.removePaths ||
    redact.removePaths.length === 0
  ) {
    return redact;
  }

  const { paths: redactPaths, removePaths } = redact;
  const redactSet = new Set(redactPaths);

  return redactPaths.length === 0
    ? { paths: removePaths, remove: true }
    : {
        paths: [...redactPaths, ...removePaths],
        censor: (_value, path) =>
          redactSet.has(keyFromPath(path)) ? '[Redacted]' : undefined,
      };
};

export const configureRedact = (redact: ExtendedRedact): ExtendedRedact =>
  configureRedactCensor(appendDefaultRedactAndRemove(redact));
