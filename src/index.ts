import pino, { type LoggerExtras } from 'pino';

import base from './base';
import { createDestination } from './destination/create';
import { withRedaction } from './destination/redact';
import { type FormatterOptions, createFormatters } from './formatters';
import * as redact from './redact';
import { type SerializerOptions, createSerializers } from './serializers';

export { createDestination } from './destination/create';
export { DEFAULT_OMIT_HEADER_NAMES } from './serializers';

export { pino };

export type LoggerOptions<CustomLevels extends string = never> =
  pino.LoggerOptions<CustomLevels> & FormatterOptions & SerializerOptions;

type PlaceholderSpecifier = 'd' | 's' | 'j' | 'o' | 'O';
type PlaceholderTypeMapping<T extends PlaceholderSpecifier> = T extends 'd'
  ? number
  : T extends 's'
    ? string
    : T extends 'j' | 'o' | 'O'
      ? object
      : never;

type ParseLogFnArgs<
  T,
  Acc extends unknown[] = [],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
> = T extends `${infer _}%${infer Placeholder}${infer Rest}`
  ? Placeholder extends PlaceholderSpecifier
    ? ParseLogFnArgs<Rest, [...Acc, PlaceholderTypeMapping<Placeholder>]>
    : ParseLogFnArgs<Rest, Acc>
  : Acc;

// FIXME: Remove if pinojs/pino#2230 lands in a release.
interface LogFn {
  <T, TMsg extends string = string>(
    obj: T,
    msg?: T extends string ? never : TMsg,
    ...args: ParseLogFnArgs<TMsg> | []
  ): void;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  <_, TMsg extends string = string>(
    msg: TMsg,
    ...args: ParseLogFnArgs<TMsg> | []
  ): void;
}

export type Logger<CustomLevels extends string = never> = Omit<
  pino.Logger<CustomLevels>,
  | 'fatal'
  | 'error'
  | 'warn'
  | 'info'
  | 'debug'
  | 'trace'
  | 'silent'
  | 'child'
  | CustomLevels
> & {
  level: pino.LevelWithSilentOrString;
  fatal: LogFn;
  error: LogFn;
  warn: LogFn;
  info: LogFn;
  debug: LogFn;
  trace: LogFn;
  silent: LogFn;
  child: <ChildCustomLevels extends string = never>(
    bindings: pino.Bindings,
    options?: pino.ChildLoggerOptions<ChildCustomLevels>,
  ) => Logger<CustomLevels | ChildCustomLevels>;
} & Record<CustomLevels, LogFn> &
  LoggerExtras<CustomLevels>;

/**
 * Creates a logger that can enforce a strict logged object shape.
 * @param opts - Logger options.
 * @param destination - Destination stream. Default: `pino.destination({ sync: true })`.
 */
export const createLogger = <CustomLevels extends string = never>(
  opts: LoggerOptions<CustomLevels> = {},
  destination: pino.DestinationStream = createDestination({ mock: false })
    .destination,
): Logger<CustomLevels> => {
  opts.redact = redact.addDefaultRedactPathStrings(opts.redact);

  const serializers = createSerializers(opts);

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

export default createLogger;
