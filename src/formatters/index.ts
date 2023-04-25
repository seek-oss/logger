import { trimmer } from 'dtrim';
import pino, { LoggerOptions } from 'pino';

import serializers from '../serializers';

export interface FormatterOptions {
  /**
   * Maximum property depth of objects being logged. Default: 4
   */
  maxObjectDepth?: number;

  /**
   * This allows finer control of redaction by providing access to the full text.
   */
  redactText?: (input: string, redactionPlaceholder: string) => string;
}

export const createFormatters = (
  opts: FormatterOptions & Pick<LoggerOptions, 'serializers'>,
): pino.LoggerOptions['formatters'] => {
  const trim = trimmer({
    depth: opts.maxObjectDepth ?? 4,
    retain: new Set(Object.keys(serializers)),
  });

  return {
    log: (input) => trim(input) as typeof input,
  };
};
