import pino from 'pino';
import {
  type Infer,
  dictionary,
  equals,
  objectCompiled,
  oneOf,
  tuple,
} from 'pure-parse';

const parseDatadogTier = oneOf(
  equals('zero'),
  equals('tin'),
  equals('tin-plus'),
  equals('tin-plus-plus'),
  equals('bronze'),
  equals('bronze-plus'),
  equals('bronze-plus-plus'),
  equals('silver'),
  equals('silver-plus'),
  equals('silver-plus-plus'),
);

type DatadogTier = Infer<typeof parseDatadogTier>;

const parseLevel = oneOf(
  equals('fatal'),
  equals('error'),
  equals('warn'),
  equals('info'),
  equals('debug'),
  equals('trace'),
);

const parseTierByLevelMap = dictionary<pino.Level, DatadogTier>(
  parseLevel,
  parseDatadogTier,
);

const parseDatadogTierByLevel = tuple([parseDatadogTier, parseTierByLevelMap]);

const parseEeeohConfig = objectCompiled({
  datadog: oneOf(parseDatadogTier, parseDatadogTierByLevel, equals(false)),
});

export type EeeohConfig = Infer<typeof parseEeeohConfig>;

export type EeeohFields = { eeeoh?: EeeohConfig };

export type EeeohOptions =
  | { eeeoh?: never; service?: never }
  | { eeeoh: EeeohConfig; service: string };

const formatOutput = (tier: DatadogTier | false) => ({
  eeeoh: {
    logs: { datadog: tier ? { enabled: true, tier } : { enabled: false } },
  },
});

type EeeohOutput = ReturnType<typeof formatOutput>;

type EeeohOutputter = (level: number) => EeeohOutput;

// TODO: support `customLevels` and `levelComparison`?
export const configToOutputter = ({ datadog }: EeeohConfig): EeeohOutputter => {
  if (datadog === false) {
    return () => formatOutput(false);
  }

  const tierDefault = Array.isArray(datadog) ? datadog[0] : datadog;

  const tierByLevel = Array.isArray(datadog) ? datadog[1] : {};

  // TODO: pre-compute mappings for O(1) lookups?
  //
  // This would be tricky if we want to support `customLevels` as they can be
  // added by child loggers, and we haven't found a convenient hook in to child
  // logger creation.
  const entries = Object.entries(tierByLevel)
    .map(([level, tier]) => {
      const numericLevel = pino.levels.values[level];
      // istanbul ignore next
      // Defensive programming for a scenario that should never happen
      if (!numericLevel) {
        throw new Error(`no numeric value associated with log level: ${level}`);
      }

      return {
        numericLevel,
        tier,
      };
    })
    .sort((a, b) => b.numericLevel - a.numericLevel);

  return (level) => {
    for (const entry of entries) {
      if (entry.numericLevel <= level) {
        return formatOutput(entry.tier);
      }
    }

    return formatOutput(tierDefault);
  };
};

export const createEeeohHooks = <CustomLevels extends string = never>(
  opts: Extract<EeeohOptions, { eeeoh: EeeohConfig }> &
    Pick<pino.LoggerOptions<CustomLevels>, 'mixin'>,
) => {
  const outputDefault: EeeohOutputter = configToOutputter(opts.eeeoh);

  const inputToOutputter = (
    input: object,
    logger: pino.Logger<CustomLevels>,
  ): EeeohOutputter => {
    // TODO: cache on `logger.bindings().eeeoh` and `input.eeeoh`?
    // This would work with `WeakMap` if we encourage and/or enforce use of
    // exported singletons, but not if there are inline declarations.
    // Good: logger.info(eeeoh.datadog.silver);
    // Bad: logger.info({ eeeoh: { datadog: 'silver' } });

    let result: ReturnType<typeof parseEeeohConfig> | undefined;

    if ('eeeoh' in input && typeof input.eeeoh === 'object' && input.eeeoh) {
      result = parseEeeohConfig(input.eeeoh);
    }
    if (!result || result.error) {
      result = parseEeeohConfig(logger.bindings().eeeoh);
    }
    if (result.error) {
      return outputDefault;
    }

    const config = result.value;

    return configToOutputter(config);
  };

  return (
    mergeObject: object,
    level: number,
    logger: pino.Logger<CustomLevels>,
  ): object => ({
    // TODO: which mixin should take precedence?
    ...(opts.mixin?.(mergeObject, level, logger) ?? {}),
    ...inputToOutputter(mergeObject, logger)(level),
  });
};
