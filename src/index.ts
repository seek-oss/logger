import pino from 'pino';

import base from './base';
import { withRedaction } from './destination';
import * as redact from './redact';
import serializers from './serializers';

export { pino };

export interface CustomLoggerOptions {
  /**
   * This allows finer control of redaction by providing access to the full text.
   */
  redactText?: (input: string, redactionPlaceholder: string) => string;
}

export type LoggerOptions = pino.LoggerOptions & CustomLoggerOptions;
export type Logger = pino.Logger;

/**
 * Creates a logger that can enforce a strict logged object shape.
 * @param opts - Logger options.
 * @param destination - Destination stream. Default: `pino.destination(1)`.
 */
export default (
  // istanbul ignore next
  opts: LoggerOptions = {},
  // istanbul ignore next
  destination: pino.DestinationStream = pino.destination(1),
): Logger => {
  opts.redact = redact.addDefaultRedactPathStrings(opts.redact);
  opts.serializers = {
    ...serializers,
    ...opts.serializers,
  };
  opts.base = {
    ...base,
    ...opts.base,
  };

  opts.timestamp ??= () => `,"timestamp":"${new Date().toISOString()}"`;

  return pino(opts, withRedaction(destination, opts.redactText));
};
