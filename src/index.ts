import pino from 'pino';

import base from './base';
import { withRedaction } from './destination';
import { type FormatterOptions, createFormatters } from './formatters';
import * as redact from './redact';
import { type SerializerOptions, createSerializers } from './serializers';

export { pino };

export type LoggerOptions = pino.LoggerOptions &
  FormatterOptions &
  SerializerOptions;
export type Logger = pino.Logger;

/**
 * Creates a logger that can enforce a strict logged object shape.
 * @param opts - Logger options.
 * @param destination - Destination stream. Default: `pino.destination({ sync: true })`.
 */
export default (
  // istanbul ignore next
  opts: LoggerOptions = {},
  // istanbul ignore next
  destination: pino.DestinationStream = pino.destination({
    sync: true,
  }),
): Logger => {
  opts.redact = redact.addDefaultRedactPathStrings(opts.redact);
  opts.serializers = createSerializers(opts);
  const formatters = createFormatters(opts);
  opts.base = {
    ...base,
    ...opts.base,
  };
  opts.formatters = {
    ...formatters,
    ...opts.formatters,
  };

  opts.timestamp ??= () => `,"timestamp":"${new Date().toISOString()}"`;

  return pino(opts, withRedaction(destination, opts.redactText));
};
