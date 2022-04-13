import type { LoggerOptions } from 'pino';

// TODO: Redact cookies?
export const defaultRedact = [];

export const addDefaultRedactPathStrings = (
  redact?: LoggerOptions['redact'],
) => {
  if (!redact) {
    return defaultRedact;
  }
  if (Array.isArray(redact)) {
    return redact.concat(defaultRedact);
  }
  return redact;
};
