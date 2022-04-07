import { trimmer } from 'dtrim';
import pino from 'pino';

export interface FormatterOptions {
  /**
   * Maximum property depth of objects being logged. Default: 4
   */
  maxObjectDepth?: number;
}

export const createFormatters = (
  opts: FormatterOptions,
): pino.LoggerOptions['formatters'] => {
  const trim = trimmer({ depth: opts.maxObjectDepth ?? 4 });

  return {
    log: (input) => trim(input) as object,
  };
};
