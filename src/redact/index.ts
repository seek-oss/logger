// TODO: Redact cookies?
export const defaultRedact = [
  "header['user-email']",
  "headers['user-email']",
  "req.headers['user-email']",
];

/**
 * Private interface vendored from `pino`
 */
interface RedactOptions {
  paths: string[];
  censor?: string | ((value: unknown, path: string[]) => unknown);
  remove?: boolean;
}

export const addDefaultRedactPathStrings = (
  redact: string[] | RedactOptions | undefined,
) => {
  if (!redact) {
    return defaultRedact;
  }
  if (Array.isArray(redact)) {
    return redact.concat(defaultRedact);
  }
  return { ...redact, paths: [...defaultRedact, ...redact.paths] };
};
