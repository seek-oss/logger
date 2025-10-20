import { trimmer } from 'dtrim';
import type { LoggerOptions } from 'pino';

export const DEFAULT_MAX_OBJECT_DEPTH = 4;

const DEFAULT_FUNCTIONS = true;
const DEFAULT_STRING_LENGTH = 512;

export interface FormatterOptions {
  /**
   * Maximum property depth of objects being logged. Default: 4
   */
  maxObjectDepth?: number;

  /**
   * Allows functions in log objects. Default: true
   */
  functions?: boolean;

  /**
   * This allows finer control of redaction by providing access to the full text.
   */
  redactText?: (input: string, redactionPlaceholder: string) => string;

  /**
   * Maximum length loggable string length. Default: 512
   */
  stringLength?: number;
}

export const createFormatters = (
  opts: FormatterOptions & Required<Pick<LoggerOptions, 'serializers'>>,
): LoggerOptions['formatters'] => {
  const trim = trimmer({
    depth: opts.maxObjectDepth ?? DEFAULT_MAX_OBJECT_DEPTH,
    functions: opts.functions ?? DEFAULT_FUNCTIONS,
    string: opts.stringLength ?? DEFAULT_STRING_LENGTH,
    retain: new Set(Object.keys(opts.serializers)),
  });

  return {
    log: (input) => trim(input) as typeof input,
  };
};
