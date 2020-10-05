import pino from 'pino';

// TODO: Redact cookies?
export const defaultRedact = [];

export const addDefaultRedactPathStrings = (
  redact: string[] | pino.redactOptions | undefined,
) => {
  if (!redact) {
    return defaultRedact;
  }
  if (Array.isArray(redact)) {
    return redact.concat(defaultRedact);
  }
  return redact;
};
