import type { EventEmitter } from 'events';

import pino from 'pino';

import base from './base/index.js';
import { createDestination } from './destination/create.js';
import { withRedaction } from './destination/redact.js';
import * as Eeeoh from './eeeoh/eeeoh.js';
import { type FormatterOptions, createFormatters } from './formatters/index.js';
import * as redact from './redact/index.js';
import {
  type SerializerOptions,
  createSerializers,
} from './serializers/index.js';

export { createDestination } from './destination/create.js';
export * as Eeeoh from './eeeoh/exports.js';
export { DEFAULT_OMIT_HEADER_NAMES } from './serializers/index.js';

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

  child<ChildCustomLevels extends never = never>(
    bindings: Eeeoh.Bindings<CustomLevels> & pino.Bindings,
    options?: undefined,
  ): Logger<CustomLevels | ChildCustomLevels>;

  child<ChildCustomLevels extends string = never>(
    bindings: Eeeoh.Bindings<CustomLevels> & pino.Bindings,
    options: Omit<pino.ChildLoggerOptions<ChildCustomLevels>, 'customLevels'>,
  ): Logger<CustomLevels | ChildCustomLevels>;

  /**
   * As of `pino@9.6.0`, a child that specifies `customLevels` can still access
   * methods corresponding to the custom levels of the parent logger, but they
   * will output malformed JSON:
   *
   * ```json
   * undefined,"timestamp":"2000-01-01T00:00:00.000Z","msg":"huh?"}
   * ```
   *
   * We hide those "parent" methods on the child to avoid this issue.
   */
  child<ChildCustomLevels extends string = never>(
    bindings: Required<Eeeoh.Bindings<ChildCustomLevels>> & pino.Bindings,
    options: Omit<
      pino.ChildLoggerOptions<ChildCustomLevels>,
      'customLevels'
    > & { customLevels: Record<ChildCustomLevels, number> },
  ): Logger<ChildCustomLevels>;
} & Record<CustomLevels, LogFn> &
  LoggerExtras<CustomLevels>;

type OnChildCallback<CustomLevels extends string = never> = (
  child: pino.Logger<CustomLevels>,
) => void;

interface LoggerExtras<
  CustomLevels extends string = never,
  UseOnlyCustomLevels extends boolean = boolean,
> extends EventEmitter {
  /**
   * Exposes the Pino package version. Also available on the exported pino function.
   */
  readonly version: string;

  levels: pino.LevelMapping;

  /**
   * Outputs the level as a string instead of integer.
   */
  useLevelLabels: boolean;
  /**
   * Returns the integer value for the logger instance's logging level.
   */
  levelVal: number;

  /**
   * Creates a child logger, setting all key-value pairs in `bindings` as properties in the log lines. All serializers will be applied to the given pair.
   * Child loggers use the same output stream as the parent and inherit the current log level of the parent at the time they are spawned.
   * From v2.x.x the log level of a child is mutable (whereas in v1.x.x it was immutable), and can be set independently of the parent.
   * If a `level` property is present in the object passed to `child` it will override the child logger level.
   *
   * @param bindings: an object of key-value pairs to include in log lines as properties.
   * @param options: an options object that will override child logger inherited options.
   * @returns a child logger instance.
   */
  child<ChildCustomLevels extends string = never>(
    bindings: Eeeoh.Bindings<CustomLevels> & pino.Bindings,
    options?: pino.ChildLoggerOptions<ChildCustomLevels>,
  ): pino.Logger<CustomLevels | ChildCustomLevels>;

  /**
   * This can be used to modify the callback function on creation of a new child.
   */
  onChild: OnChildCallback<CustomLevels>;

  /**
   * Registers a listener function that is triggered when the level is changed.
   * Note: When browserified, this functionality will only be available if the `events` module has been required elsewhere
   * (e.g. if you're using streams in the browser). This allows for a trade-off between bundle size and functionality.
   *
   * @param event: only ever fires the `'level-change'` event
   * @param listener: The listener is passed four arguments: `levelLabel`, `levelValue`, `previousLevelLabel`, `previousLevelValue`.
   */
  on(
    event: 'level-change',
    listener: pino.LevelChangeEventListener<CustomLevels, UseOnlyCustomLevels>,
  ): this;
  addListener(
    event: 'level-change',
    listener: pino.LevelChangeEventListener<CustomLevels, UseOnlyCustomLevels>,
  ): this;
  once(
    event: 'level-change',
    listener: pino.LevelChangeEventListener<CustomLevels, UseOnlyCustomLevels>,
  ): this;
  prependListener(
    event: 'level-change',
    listener: pino.LevelChangeEventListener<CustomLevels, UseOnlyCustomLevels>,
  ): this;
  prependOnceListener(
    event: 'level-change',
    listener: pino.LevelChangeEventListener<CustomLevels, UseOnlyCustomLevels>,
  ): this;
  removeListener(
    event: 'level-change',
    listener: pino.LevelChangeEventListener<CustomLevels, UseOnlyCustomLevels>,
  ): this;

  /**
   * A utility method for determining if a given log level will write to the destination.
   */
  isLevelEnabled(level: pino.LevelWithSilentOrString): boolean;

  /**
   * Returns an object containing all the current bindings, cloned from the ones passed in via logger.child().
   */
  bindings(): pino.Bindings;

  /**
   * Adds to the bindings of this logger instance.
   * Note: Does not overwrite bindings. Can potentially result in duplicate keys in log lines.
   *
   * @param bindings: an object of key-value pairs to include in log lines as properties.
   */
  setBindings(bindings: pino.Bindings): void;

  /**
   * Flushes the content of the buffer when using pino.destination({ sync: false }).
   * call the callback when finished
   */
  flush(cb?: (err?: Error) => void): void;
}

/**
 * Creates a logger that can enforce a strict logged object shape.
 * @param opts - Logger options.
 * @param destination - Destination stream. Default: `pino.destination({ sync: true })`.
 */
export const createLogger = <CustomLevels extends string = never>(
  opts: Readonly<LoggerOptions<CustomLevels>> = {},
  destination: pino.DestinationStream = createDestination({ mock: false })
    .destination,
): Logger<CustomLevels> => {
  const {
    eeeoh: _,
    maxObjectDepth,
    omitHeaderNames,
    redactText,
    ...pinoOpts
  } = opts;

  const serializers = createSerializers({
    omitHeaderNames,
    maxObjectDepth,
    serializers: opts.serializers,
  });

  const formatters = createFormatters({
    maxObjectDepth,
    redactText,
    serializers,
  });

  const eeeoh = Eeeoh.createOptions(opts);

  return pino(
    {
      ...pinoOpts,
      base: { ...base, ...eeeoh.base, ...opts.base },
      errorKey: opts.errorKey ?? eeeoh.errorKey,
      formatters: { ...formatters, ...opts.formatters },
      mixin: eeeoh.mixin,
      mixinMergeStrategy: eeeoh.mixinMergeStrategy,
      redact: redact.addDefaultRedactPathStrings(opts.redact),
      serializers,
      timestamp:
        opts.timestamp ?? (() => `,"timestamp":"${new Date().toISOString()}"`),
    },
    withRedaction(destination, redactText),
  );
};

export default createLogger;
