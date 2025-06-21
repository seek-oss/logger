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

type LevelToTier = (level: number) => DatadogTier | false | null;

const parseTierByLevelMap = dictionary<string, DatadogTier>(
  parseString,
  parseDatadogTier,
);

const parseDatadogTierByLevel = tuple([parseDatadogTier, parseTierByLevelMap]);

const parseEeeohConfig = objectCompiled<EeeohConfig<string>>({
  datadog: oneOf(parseDatadogTier, parseDatadogTierByLevel, equals(false)),
});

const parseEeeohField = objectCompiled<NonNullable<EeeohFields['eeeoh']>>({
  datadog: oneOf(parseDatadogTier, equals(false)),
});

export type EeeohConfig<CustomLevels extends string> = {
  datadog:
    | DatadogTier
    | [DatadogTier, Partial<Record<CustomLevels | pino.Level, DatadogTier>>]
    | false;
};

export type EeeohBindings<CustomLevels extends string> = {
  eeeoh?: EeeohConfig<CustomLevels>;
};

export type EeeohFields = {
  eeeoh?: {
    datadog: DatadogTier | false;
  };
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

const formatOutput = (tier: DatadogTier | false | null) =>
  tier === null
    ? {}
    : {
        eeeoh: {
          logs: {
            datadog: tier ? { enabled: true, tier } : { enabled: false },
          },
        },
      };

const getConfigForLogger = <CustomLevels extends string>(
  logger: pino.Logger<CustomLevels>,
): EeeohConfig<CustomLevels> | null => {
  const eeeoh: unknown = logger.bindings().eeeoh;
  if (!eeeoh) {
    // Skip parsing if the `eeeoh` property is not present
    return null;
  }

  const result = parseEeeohConfig(eeeoh);
  if (result.error) {
    return null;
  }

  return result.value;
};

const getTierForLevel = (
  level: number,
  entries: Array<{ levelValue: number; tier?: DatadogTier }>,
  defaultTier: DatadogTier | null,
): DatadogTier | null => {
  for (const entry of entries) {
    if (entry.tier && entry.levelValue <= level) {
      return entry.tier;
    }
  }

  return defaultTier;
};

export const createEeeohHooks = <CustomLevels extends string>(
  opts: Pick<EeeohOptions<CustomLevels>, 'eeeoh'> &
    Pick<pino.LoggerOptions<CustomLevels>, 'mixin' | 'mixinMergeStrategy'>,
): Pick<pino.LoggerOptions<CustomLevels>, 'mixin' | 'mixinMergeStrategy'> => {
  const levelToTierCache = new WeakMap<
    pino.Logger<CustomLevels>,
    LevelToTier
  >();

  const getLevelToTier = (logger: pino.Logger<CustomLevels>): LevelToTier => {
    // This cache implementation does not track out-of-band changes to the
    // logger binding, i.e. `logger.setBindings({ eeeoh: { /* ... */ } })`.
    // There should be no good reason to do that and we should discourage it.
    const cached = levelToTierCache.get(logger);
    if (cached) {
      return cached;
    }

    const { datadog } = getConfigForLogger(logger) ??
      opts.eeeoh ?? { datadog: null };

    if (datadog === false || datadog === null) {
      const levelToTier: LevelToTier = () => datadog;

      levelToTierCache.set(logger, levelToTier);

      return levelToTier;
    }

    const tierDefault = Array.isArray(datadog) ? datadog[0] : datadog;

    const tierByLevel: Partial<Record<string, DatadogTier>> = Array.isArray(
      datadog,
    )
      ? datadog[1]
      : {};

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

    const precomputations = Object.fromEntries(
      Object.values(logger.levels.values).map((levelValue) => [
        levelValue,
        getTierForLevel(levelValue, entries, tierDefault),
      ]),
    );

    const levelToTier: LevelToTier = (level) =>
      // No known way of choosing a level that isn't in `logger.levels`
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      precomputations[level]!;

    levelToTierCache.set(logger, levelToTier);

    return levelToTier;
  };

  const getTier = (
    input: object,
    level: number,
    logger: pino.Logger<CustomLevels>,
  ): DatadogTier | false | null => {
    if ('eeeoh' in input) {
      const result = parseEeeohField(input.eeeoh);

      if (result?.tag === 'success') {
        return result.value.datadog;
      }
    }

    const levelToTier = getLevelToTier(logger);

    return levelToTier(level);
  };

  return {
    mixin: (mergeObject, level, logger) => {
      const tier = getTier(mergeObject, level, logger);

      return {
        ...opts.mixin?.(mergeObject, level, logger),

        // Take precedence over the user-provided `mixin` for the `eeeoh` property
        ...formatOutput(tier),
      };
    },

    mixinMergeStrategy: (mergeObject, mixinObject) => {
      const retain = 'eeeoh' in mixinObject ? { eeeoh: mixinObject.eeeoh } : {};

      const merged =
        opts.mixinMergeStrategy?.(mergeObject, mixinObject) ??
        Object.assign(mixinObject, mergeObject);

      // TODO: should we mutate for performance or shallow clone for safety?
      return { ...merged, ...retain };
    },
  };
};
