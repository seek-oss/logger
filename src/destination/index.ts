import { DestinationStream } from 'pino';

const bearerMatcher = /\bbearer\s[\w._-]{25,}/gi;
const redactedDummy = '[Redacted]';

export const withRedaction = (dest: DestinationStream): DestinationStream => {
  const write = dest.write.bind(dest);

  dest.write = (input) => {
    const redacted = input.replace(bearerMatcher, redactedDummy);
    return write(redacted);
  };

  return dest;
};
