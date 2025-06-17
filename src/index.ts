import pino from 'pino';

import base from './base';
import { createDestination } from './destination/create';
import { withRedaction } from './destination/redact';
import { type FormatterOptions, createFormatters } from './formatters';
import {
  type HookBindings,
  type HookFields,
  type HookOptions,
  createHooks,
} from './hooks/create';
import * as redact from './redact';
import { type SerializerOptions, createSerializers } from './serializers';

export { createDestination } from './destination/create';
export { DEFAULT_OMIT_HEADER_NAMES } from './serializers';

export { pino };

export type LoggerOptions<CustomLevels extends string = never> =
  pino.LoggerOptions<CustomLevels> &
    HookOptions<CustomLevels> &
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
    obj: HookFields & T,
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
    bindings: HookBindings<CustomLevels> & pino.Bindings,
    options?: undefined,
  ): Logger<CustomLevels | ChildCustomLevels>;

  child<ChildCustomLevels extends string = never>(
    bindings: HookBindings<CustomLevels> & pino.Bindings,
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
    bindings: Required<HookBindings<ChildCustomLevels>> & pino.Bindings,
    options: Omit<
      pino.ChildLoggerOptions<ChildCustomLevels>,
      'customLevels'
    > & { customLevels: Record<ChildCustomLevels, number> },
  ): Logger<ChildCustomLevels>;
} & Record<CustomLevels, LogFn>;

/**
 * Creates a logger that can enforce a strict logged object shape.
 * @param opts - Logger options.
 * @param destination - Destination stream. Default: `pino.destination({ sync: true })`.
 */
export default <CustomLevels extends string = never>(
  { eeeoh, service, ...opts }: LoggerOptions<CustomLevels> = {},
  destination: pino.DestinationStream = createDestination({ mock: false })
    .destination,
): Logger<CustomLevels> => {
  opts.redact = redact.addDefaultRedactPathStrings(opts.redact);

  const originalMergeStrategy = opts.mixinMergeStrategy;

  opts.mixin = createHooks({ eeeoh, mixin: opts.mixin });

  opts.mixinMergeStrategy = (mergeObject, mixinObject) => {
    const retain = 'eeeoh' in mixinObject ? { eeeoh: mixinObject.eeeoh } : {};

    const merged =
      originalMergeStrategy?.(mergeObject, mixinObject) ??
      Object.assign(mixinObject, mergeObject);

    // TODO: should we mutate for performance or shallow clone for safety?
    return { ...merged, ...retain };
  };

  const serializers = createSerializers(opts);

  opts.serializers = serializers;

  const formatters = createFormatters({ ...opts, serializers });
  opts.base = {
    ...base,
    service,
    ...opts.base,
  };
  opts.formatters = {
    ...formatters,
    ...opts.formatters,
  };

  opts.timestamp ??= () => `,"timestamp":"${new Date().toISOString()}"`;

  return pino(opts, withRedaction(destination, opts.redactText));
};
