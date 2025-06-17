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

type LevelToTier = (level: number) => DatadogTier | false;

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
  | {
      eeeoh?: never;
      service?: never;
    }
  | {
      eeeoh: EeeohConfig;
      /**
       * You cannot customise level comparison if you opt in to eeeoh.
       *
       * It's unnecessarily complex to have to reason about custom comparison
       * logic when using level-based Datadog log tiering.
       */
      levelComparison?: never;
      service: string;
    };

const formatOutput = (tier: DatadogTier | false) => ({
  eeeoh: {
    logs: { datadog: tier ? { enabled: true, tier } : { enabled: false } },
  },
});

const getConfig = <CustomLevels extends string = never>(
  logger: pino.Logger<CustomLevels>,
  input: object,
): EeeohConfig | undefined => {
  let result: ReturnType<typeof parseEeeohConfig> | undefined;
  let bindings: pino.Bindings | undefined;

  // Skip parsing if the `eeeoh` property is not present
  if ('eeeoh' in input) {
    result = parseEeeohConfig(input.eeeoh);
  }
  // Skip parsing if the above parsed or the `eeeoh` property is not present
  if ((!result || result.error) && 'eeeoh' in (bindings = logger.bindings())) {
    result = parseEeeohConfig(bindings.eeeoh);
  }

  if (result?.tag === 'success') {
    return result.value;
  }

  return;
};

export const createEeeohHooks = <CustomLevels extends string = never>(
  opts: Extract<EeeohOptions, { eeeoh: EeeohConfig }> &
    Pick<pino.LoggerOptions<CustomLevels>, 'mixin'>,
) => {
  const getLevelToTier = (
    input: object,
    logger: pino.Logger<CustomLevels>,
  ): LevelToTier => {
    const { datadog } = getConfig(logger, input) ?? opts.eeeoh;

    if (datadog === false) {
      const levelToTier: LevelToTier = () => false;

      return levelToTier;
    }

    const tierDefault = Array.isArray(datadog) ? datadog[0] : datadog;

    const tierByLevel = Array.isArray(datadog) ? datadog[1] : {};

    // TODO: pre-compute mappings for O(1) lookups?
    const entries = Object.entries(tierByLevel)
      .map(([level, tier]) => {
        const numericLevel = pino.levels.values[level];
        // istanbul ignore next
        // Defensive programming for a scenario that should never happen
        if (!numericLevel) {
          throw new Error(
            `no numeric value associated with log level: ${level}`,
          );
        }

        return {
          numericLevel,
          tier,
        };
      })
      .sort((a, b) => b.numericLevel - a.numericLevel);

    const levelToTier: LevelToTier = (level) => {
      for (const entry of entries) {
        if (entry.numericLevel <= level) {
          return entry.tier;
        }
      }

      return tierDefault;
    };

    return levelToTier;
  };

  return (
    mergeObject: object,
    level: number,
    logger: pino.Logger<CustomLevels>,
  ): object => {
    const levelToTier = getLevelToTier(mergeObject, logger);

    const tier = levelToTier(level);

    return {
      // TODO: which mixin should take precedence?
      ...(opts.mixin?.(mergeObject, level, logger) ?? {}),
      ...formatOutput(tier),
    };
  };
};
