import pino from 'pino';

import base from './base';
import { withRedaction } from './destination';
import { type FormatterOptions, createFormatters } from './formatters';
import * as redact from './redact';
import serializers from './serializers';

export { pino };

export type LoggerOptions = Omit<pino.LoggerOptions, 'redact'> &
  FormatterOptions & { redact?: redact.ExtendedRedactOptions };
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
  opts.redact = redact.configureRedactCensor(opts.redact);
  opts.serializers = {
    ...serializers,
    ...opts.serializers,
  };
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
