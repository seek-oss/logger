import pino from 'pino';

import base from './base';
import { createDestination } from './destination/create';
import { withRedaction } from './destination/redact';
import * as Eeeoh from './eeeoh/eeeoh';
import { type FormatterOptions, createFormatters } from './formatters';
import * as redact from './redact';
import { type SerializerOptions, createSerializers } from './serializers';

export { createDestination } from './destination/create';
export * as Eeeoh from './eeeoh/exports';
export { DEFAULT_OMIT_HEADER_NAMES } from './serializers';

export { pino };

export type LoggerOptions<CustomLevels extends string = never> = Exclude<
  pino.LoggerOptions<CustomLevels>,
  'base'
> &
  Eeeoh.Options<CustomLevels> &
  FormatterOptions &
  SerializerOptions;

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
    obj: T extends object ? Eeeoh.Fields & T : T,
    msg?: T extends string ? never : TMsg,
    ...args: ParseLogFnArgs<TMsg> | []
  ): void;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  <_, TMsg extends string = string>(
    msg: TMsg,
    ...args: ParseLogFnArgs<TMsg> | []
  ): void;
}

type PinoLogger<CustomLevels extends string = never> = Omit<
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

  child<ChildCustomLevels extends string = never>(
    bindings: Eeeoh.Bindings<CustomLevels> & pino.Bindings,
    options?: pino.ChildLoggerOptions<ChildCustomLevels>,
  ): Logger<CustomLevels | ChildCustomLevels>;
} & Record<CustomLevels, LogFn>;

export type Logger<CustomLevels extends string = never> = Omit<
  PinoLogger<CustomLevels>,
  'child'
> & {
  child<ChildCustomLevels extends string = never>(
    bindings: Eeeoh.Bindings<CustomLevels> & pino.Bindings,
    options?: Omit<
      pino.ChildLoggerOptions<ChildCustomLevels>,
      /**
       * As of `pino@9.6.0`, a child that specifies `customLevels` can still
       * access methods corresponding to the custom levels of the parent logger,
       * but they will output malformed JSON:
       *
       * ```json
       * undefined,"timestamp":"2000-01-01T00:00:00.000Z","msg":"huh?"}
       * ```
       *
       * We omit child `customLevels` to avoid this issue.
       */
      'customLevels'
    >,
  ): Logger<CustomLevels | ChildCustomLevels>;
};

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

  const eeeoh = Eeeoh.createOptions(opts);
  opts.errorKey ??= eeeoh.errorKey;
  opts.mixin = eeeoh.mixin;
  opts.mixinMergeStrategy = eeeoh.mixinMergeStrategy;

  const serializers = createSerializers(opts);

  opts.serializers = serializers;

  const formatters = createFormatters({ ...opts, serializers });
  opts.base = {
    ...base,
    ...eeeoh.base,
    ...opts.base,
  };
  opts.formatters = {
    ...formatters,
    ...opts.formatters,
  };

  opts.timestamp ??= () => `,"timestamp":"${new Date().toISOString()}"`;

  const logger: PinoLogger<CustomLevels> = pino(
    opts,
    withRedaction(destination, opts.redactText),
  );

  // TypeScript doesn't like us omitting `customLevels`
  return logger as Logger<CustomLevels>;
};

export default createLogger;
