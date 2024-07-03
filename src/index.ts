import pino from 'pino';

import base from './base';
import { createDestination } from './destination/create';
import { withRedaction } from './destination/redact';
import { type FormatterOptions, createFormatters } from './formatters';
import * as redact from './redact';
import { type SerializerOptions, createSerializers } from './serializers';

export { createDestination } from './destination/create';
export { DEFAULT_OMIT_HEADER_NAMES } from './serializers';

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
  opts: LoggerOptions = {},
  destination: pino.DestinationStream = createDestination({ mock: false })
    .destination,
): Logger => {
  opts.redact = redact.addDefaultRedactPathStrings(opts.redact);

  const serializers = {
    ...createSerializers(opts),
    ...opts.serializers,
  };

  opts.serializers = serializers;

  const formatters = createFormatters({ ...opts, serializers });
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
