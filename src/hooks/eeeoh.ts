import pino from 'pino';
import {
  type Infer,
  dictionary,
  equals,
  objectCompiled,
  oneOf,
  parseString,
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

const parseTierByLevelMap = dictionary<string, DatadogTier>(
  parseString,
  parseDatadogTier,
);

const parseDatadogTierByLevel = tuple([parseDatadogTier, parseTierByLevelMap]);

const parseEeeohConfig = objectCompiled<EeeohConfig<string>>({
  datadog: oneOf(parseDatadogTier, parseDatadogTierByLevel, equals(false)),
});

export type EeeohConfig<CustomLevels extends string> = {
  datadog:
    | DatadogTier
    | [DatadogTier, Partial<Record<CustomLevels | pino.Level, DatadogTier>>]
    | false;
};

export type EeeohFields<CustomLevels extends string> = {
  eeeoh?: EeeohConfig<CustomLevels>;
};

export type EeeohOptions<CustomLevels extends string> =
  | {
      eeeoh?: never;
      service?: never;
    }
  | {
      eeeoh: EeeohConfig<CustomLevels>;
      service: string;

      /**
       * You cannot customise level comparison if you opt in to eeeoh.
       *
       * Custom comparison logic is difficult to reason about in relation to
       * level-based Datadog log tiering.
       *
       * Please contact the maintainers if you have a use case for this.
       */
      levelComparison?: never;

      /**
       * You cannot disable default levels if you opt in to eeeoh.
       *
       * A fully custom scale of log levels is complex to support in relation to
       * level-based Datadog log tiering.
       *
       * Please contact the maintainers if you have a use case for this.
       */
      useOnlyCustomLevels?: false;
    };

const formatOutput = (tier: DatadogTier | false) => ({
  eeeoh: {
    logs: { datadog: tier ? { enabled: true, tier } : { enabled: false } },
  },
});

const getConfig = <CustomLevels extends string>(
  logger: pino.Logger<CustomLevels>,
  input: object,
): EeeohConfig<CustomLevels> | undefined => {
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

export const createEeeohHooks = <CustomLevels extends string>(
  opts: Extract<
    EeeohOptions<CustomLevels>,
    { eeeoh: EeeohConfig<CustomLevels> }
  > &
    Pick<pino.LoggerOptions<CustomLevels>, 'mixin'>,
) => {
  const levelToTierCache = new WeakMap<
    pino.Logger<CustomLevels>,
    LevelToTier
  >();

  const getLevelToTier = (
    input: object,
    logger: pino.Logger<CustomLevels>,
  ): LevelToTier => {
    if (!('eeeoh' in input)) {
      // This cache implementation does not track out-of-band changes to the
      // logger binding, i.e. `logger.setBindings({ eeeoh: { /* ... */ } })`.
      // There should be no good reason to do that and we should discourage it.
      const cached = levelToTierCache.get(logger);
      if (cached) {
        return cached;
      }
    }

    const { datadog } = getConfig(logger, input) ?? opts.eeeoh;

    if (datadog === false) {
      const levelToTier: LevelToTier = () => false;

      levelToTierCache.set(logger, levelToTier);

      return levelToTier;
    }

    const tierDefault = Array.isArray(datadog) ? datadog[0] : datadog;

    const tierByLevel: Partial<Record<string, DatadogTier>> = Array.isArray(
      datadog,
    )
      ? datadog[1]
      : {};

    // TODO: pre-compute mappings for O(1) lookups?
    const entries = Object.entries(tierByLevel)
      .map(([levelLabel, tier]) => {
        const levelValue =
          logger.levels.values[levelLabel] ?? pino.levels.values[levelLabel];

        if (!levelValue) {
          throw new Error(
            `No numeric value associated with log level: ${levelLabel}. Ensure custom levels listed in \`eeeoh.datadog\` are configured as \`customLevels\` of the logger instance.`,
          );
        }

        return {
          levelValue,
          tier,
        };
      })
      .sort((a, b) => b.levelValue - a.levelValue);

    const levelToTier: LevelToTier = (level) => {
      for (const entry of entries) {
        if (entry.tier && entry.levelValue <= level) {
          return entry.tier;
        }
      }

      return tierDefault;
    };

    levelToTierCache.set(logger, levelToTier);

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
