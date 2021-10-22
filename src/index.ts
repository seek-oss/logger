import pino from 'pino';

import base from './base';
import { withRedaction } from './destination';
import { FormatterOptions, createFormatters } from './formatters';
import * as redact from './redact';
import serializers from './serializers';

export { pino };

export type LoggerOptions = pino.LoggerOptions & FormatterOptions;
export type Logger = pino.Logger;

/**
 * Creates a logger that can enforce a strict logged object shape.
 * @param opts - Logger options.
 * @param destination - Destination stream. Default: `pino.destination(1)`.
 */
export default (
  opts: LoggerOptions = {},
  destination: pino.DestinationStream = pino.destination(1),
): pino.Logger => {
  const formatters = createFormatters(opts);

  opts.redact = redact.addDefaultRedactPathStrings(opts.redact);
  opts.serializers = {
    ...serializers,
    ...opts.serializers,
  };
  opts.base = {
    ...base,
    ...opts.base,
  };
  opts.formatters = {
    ...formatters,
    ...opts.formatters,
  };
  opts.timestamp = () => `,"timestamp":"${new Date().toISOString()}"`;

  return pino(opts, withRedaction(destination));
};
