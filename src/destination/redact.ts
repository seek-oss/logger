import type pino from 'pino';

import type { FormatterOptions } from '../formatters/index.js';

const bearerMatcher = /\bbearer\s[\w._-]{25,}/gi;
const redactedDummy = '[Redacted]';

export const withRedaction = (
  dest: pino.DestinationStream,
  redactText: FormatterOptions['redactText'],
): pino.DestinationStream => {
  const write = dest.write.bind(dest);

  dest.write = (input) => {
    let redacted = input.replace(bearerMatcher, redactedDummy);
    redacted = redactText?.(redacted, redactedDummy) ?? redacted;
    return write(redacted);
  };

  return dest;
};
