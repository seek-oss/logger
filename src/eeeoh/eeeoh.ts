import pino from 'pino';
import {
  type Infer,
  chain,
  dictionary,
  equals,
  failure,
  objectCompiled,
  oneOf,
  parseString,
  success,
  tuple,
} from 'pure-parse';

import { ddtags } from './ddtags';

export const envs = ['development', 'production', 'sandbox', 'test'] as const;

export type Env = (typeof envs)[number];

const parseNonEmptyString = chain(parseString, (value) =>
  value.trim().length ? success(value) : failure('String cannot be empty'),
);

const parseEnv = oneOf(...envs.map((env) => equals(env)));

const parseBase = objectCompiled({
  env: parseEnv,
  service: parseNonEmptyString,
  version: parseNonEmptyString,
});

type ParseBase = Infer<typeof parseBase>;

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

export type DatadogTier = Infer<typeof parseDatadogTier>;

export type DatadogConfig<CustomLevels extends string = never> =
  | DatadogTier
  | [DatadogTier, Partial<Record<CustomLevels | pino.Level, DatadogTier>>]
  | false;

type LevelToTier = (level: number) => DatadogTier | false | null;

const parseTierByLevelMap = dictionary<string, DatadogTier>(
  parseString,
  parseDatadogTier,
);

const parseDatadogTierByLevel = tuple([parseDatadogTier, parseTierByLevelMap]);

const parseEeeohConfig = objectCompiled<Config<string>>({
  datadog: oneOf(parseDatadogTier, parseDatadogTierByLevel, equals(false)),
});

const parseEeeohField = objectCompiled<NonNullable<Fields['eeeoh']>>({
  datadog: oneOf(parseDatadogTier, equals(false)),
});

export type Config<CustomLevels extends string> = {
  /**
   * Configuration for routing logs to Datadog.
   *
   * The following options are currently supported:
   *
   * 1. Specify a static default tier:
   *
   *    ```typescript
   *    'tin'
   *    ```
   *
   * 2. Specify level-based tiering:
   *
   *    ```typescript
   *    ['tin', { warn: 'silver' }]
   *    ```
   *
   * 3. Disable routing to Datadog:
   *
   *    ```typescript
   *    false
   *    ```
   *
   * See the documentation for more information:
   * https://github.com/seek-oss/logger/blob/master/docs/eeeoh.md
   */
  datadog: DatadogConfig<CustomLevels>;
};

export type Bindings<CustomLevels extends string> = {
  /**
   * @deprecated Set `env` upfront in the top-level `base` logger option.
   *
   * It's unlikely that you need to differ the `env` in a child logger.
   *
   * Contact the maintainers if you have a use case for this.
   */
  env?: never;

  /**
   * @deprecated Set `service` upfront in the top-level `base` logger option.
   *
   * It's unlikely that you need to differ the `service` in a child logger.
   *
   * Contact the maintainers if you have a use case for this.
   */
  service?: never;

  /**
   * @deprecated Set `version` upfront in the top-level `base` logger option.
   *
   * It's unlikely that you need to differ the `version` in a child logger.
   *
   * Contact the maintainers if you have a use case for this.
   */
  version?: never;

  /**
   * @deprecated Do not customise `ddsource`.
   *
   * This is pre-configured to match the expectations of eeeoh destinations.
   *
   * Contact the maintainers if you have a use case for this.
   */
  ddsource?: never;

  /**
   * @deprecated Do not customise `ddtags`.
   *
   * This is pre-configured to match the expectations of eeeoh destinations.
   *
   * Contact the maintainers if you have a use case for this.
   */
  ddtags?: never;

  /**
   * The eeeoh routing configuration for the child logger.
   *
   * This will overwrite configuration set in the root logger.
   *
   * See the documentation for more information:
   * https://github.com/seek-oss/logger/blob/master/docs/eeeoh.md
   */
  eeeoh?: Config<CustomLevels>;

  /**
   * @deprecated Use `eeeoh` with 3 `e`s.
   */
  eeoh?: never;

  /**
   * @deprecated Use `eeeoh` with 3 `e`s.
   */
  eeeeoh?: never;

  /**
   * The SEEK `X-Request-Id` used to correlate requests.
   */
  'x-request-id'?: string;
};

export type Fields = {
  /**
   * @deprecated Set `env` upfront in the top-level `base` logger option.
   *
   * It's unlikely that you need to differ the `env` in a log event.
   *
   * Contact the maintainers if you have a use case for this.
   */
  env?: never;

  /**
   * @deprecated Set `service` upfront in the top-level `base` logger option.
   *
   * It's unlikely that you need to differ the `service` in a log event.
   *
   * Contact the maintainers if you have a use case for this.
   */
  service?: never;

  /**
   * @deprecated Set `version` upfront in the top-level `base` logger option.
   *
   * It's unlikely that you need to differ the `version` in a log event.
   *
   * Contact the maintainers if you have a use case for this.
   */
  version?: never;

  /**
   * @deprecated Do not customise `ddsource`.
   *
   * This is pre-configured to match the expectations of eeeoh destinations.
   *
   * Contact the maintainers if you have a use case for this.
   */
  ddsource?: never;

  /**
   * @deprecated Do not customise `ddtags`.
   *
   * This is pre-configured to match the expectations of eeeoh destinations.
   *
   * Contact the maintainers if you have a use case for this.
   */
  ddtags?: never;

  /**
   * The eeeoh routing configuration for this specific log.
   *
   * This will overwrite configuration set on the logger.
   *
   * See the documentation for more information:
   * https://github.com/seek-oss/logger/blob/master/docs/eeeoh.md
   */
  eeeoh?: {
    datadog: DatadogTier | false;
  };

  /**
   * @deprecated Use `eeeoh` with 3 `e`s.
   */
  eeoh?: never;

  /**
   * @deprecated Use `eeeoh` with 3 `e`s.
   */
  eeeeoh?: never;

  /**
   * @deprecated Use `error` instead.
   */
  err?: unknown;

  /**
   * The error object associated with the log.
   *
   * This provides better compatibility with Datadog log management.
   */
  error?: unknown;

  /**
   * The duration of a given event in nanoseconds.
   *
   * This provides better compatibility with Datadog tracing.
   */
  duration?: number;

  /**
   * @deprecated Use `duration` with nanoseconds instead.
   */
  latency?: number;

  /**
   * The SEEK `X-Request-Id` used to correlate requests.
   */
  'x-request-id'?: string;
};

type Base = {
  /**
   * The environment that the component is deployed to.
   *
   * Carefully set this to enable correlation of observability data.
   *
   * See the documentation for more information:
   * https://github.com/seek-oss/logger/blob/master/docs/eeeoh.md
   */
  env: Env;

  /**
   * The name of the component, or the service name override on a
   * deployment of the component.
   *
   * Carefully set this to enable correlation of observability data.
   *
   * See the documentation for more information:
   * https://github.com/seek-oss/logger/blob/master/docs/eeeoh.md
   */
  service: string;

  /**
   * The unique identifier for the current deployment.
   *
   * Carefully set this to enable correlation of observability data.
   *
   * See the documentation for more information:
   * https://github.com/seek-oss/logger/blob/master/docs/eeeoh.md
   */
  version: string;

  /**
   * @deprecated Do not customise `ddsource`.
   *
   * This is pre-configured to match the expectations of eeeoh destinations.
   *
   * Contact the maintainers if you have a use case for this.
   */
  ddsource?: never;

  /**
   * @deprecated Do not customise `ddtags`.
   *
   * This is pre-configured to match the expectations of eeeoh destinations.
   *
   * Contact the maintainers if you have a use case for this.
   */
  ddtags?: never;

  /**
   * @deprecated Use the top-level `eeeoh` logger option.
   */
  eeeoh?: never;

  /**
   * @deprecated Use the top-level `eeeoh` logger option with 3 `e`s.
   */
  eeoh?: never;

  /**
   * @deprecated Use the top-level `eeeoh` logger option with 3 `e`s.
   */
  eeeeoh?: never;

  /**
   * @deprecated Use `service`.
   */
  app?: never;

  /**
   * @deprecated Use `env`.
   */
  environment?: never;

  /**
   * @deprecated Use `service`.
   */
  name?: never;

  [key: string]: unknown;
};

export type Options<CustomLevels extends string> =
  | {
      /**
       * The eeeoh routing configuration for the logger.
       *
       * See the documentation for more information:
       * https://github.com/seek-oss/logger/blob/master/docs/eeeoh.md
       */
      eeeoh?: never;

      base?: null | {
        /**
         * @deprecated Use the top-level `eeeoh` logger option.
         */
        eeeoh?: never;

        [key: string]: unknown;
      };
    }
  | ((
      | {
          /**
           * The eeeoh routing configuration for the logger.
           *
           * See the documentation for more information:
           * https://github.com/seek-oss/logger/blob/master/docs/eeeoh.md
           */
          eeeoh: Config<CustomLevels> & {
            /**
             * Whether to infer mandatory `base` attributes from a source.
             *
             * `environment` reads from the following environment variables:
             *
             * - `DD_ENV` - The environment that the component is deployed to,
             *   e.g. `production`.
             * - `DD_SERVICE` - The name of the component, or the service name
             *   override on a deployment of the component, e.g.
             *   `my-component-name` or `my-service-name-override`.
             * - `DD_VERSION` | `VERSION` - The unique identifier for the
             *   current deployment, e.g. `abcdefa.123`.
             *
             * Carefully set these to enable correlation of observability data.
             * An error is thrown if they fail validation as we recommend
             * failing fast over silently continuing in a misconfigured state.
             *
             * `mock` defaults to static attributes. This is provided for test
             * environments that may not have the requisite environment
             * variables set. **Do not use for real deployment environments.**
             *
             * See the documentation for more information:
             * https://github.com/seek-oss/logger/blob/master/docs/eeeoh.md
             */
            use: 'environment' | 'mock';
          };

          base?: Partial<Base>;
        }
      | {
          /**
           * The eeeoh routing configuration for the logger.
           *
           * See the documentation for more information:
           * https://github.com/seek-oss/logger/blob/master/docs/eeeoh.md
           */
          eeeoh: Config<CustomLevels>;

          base: Base;
        }
    ) & {
      /**
       * @deprecated Do not customise `errorKey` if you opt in to eeeoh.
       *
       * This is pre-configured to match the expectations of eeeoh destinations.
       *
       * Contact the maintainers if you have a use case for this.
       */
      errorKey?: never;

      /**
       * @deprecated Do not customise `levelComparison` if you opt in to eeeoh.
       *
       * Custom comparison logic is difficult to reason about in relation to
       * level-based Datadog log tiering.
       *
       * Contact the maintainers if you have a use case for this.
       */
      levelComparison?: never;

      /**
       * @deprecated Do not disable default levels if you opt in to eeeoh.
       *
       * A fully custom scale of log levels is complex to support in relation to
       * level-based Datadog log tiering.
       *
       * Contact the maintainers if you have a use case for this.
       */
      useOnlyCustomLevels?: false;
    });

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
): Config<CustomLevels> | null => {
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

const sourceBaseValues = <CustomLevels extends string>(
  opts: Extract<CreateOptions<CustomLevels>, { eeeoh: object }>,
): Record<keyof ParseBase, unknown> => {
  if (!('use' in opts.eeeoh)) {
    return {
      env: opts.base?.env,
      service: opts.base?.service,
      version: opts.base?.version,
    };
  }

  switch (opts.eeeoh.use) {
    case 'environment':
      return {
        env: process.env.DD_ENV,
        service: process.env.DD_SERVICE,
        version:
          process.env.DD_VERSION ??
          // Fallback for Gantry which only sets `VERSION`
          process.env.VERSION,
      };

    case 'mock':
      return {
        env: 'test',
        service: 'test-service',
        version: 'test-version',
      } satisfies ParseBase;
  }
};

const validate = {
  env: (value: unknown) =>
    parseEnv(value).error
      ? `expected ${envs.map((e) => JSON.stringify(e)).join(' | ')}, received ${JSON.stringify(value)}`
      : null,

  nonEmptyString: (value: unknown) =>
    parseNonEmptyString(value).error
      ? `expected non-empty string, received ${JSON.stringify(value)}`
      : null,
};

const newValidationError = <
  E extends string,
  S extends string,
  V extends string,
>(
  preamble: string,
  data: Record<string, unknown> | undefined,
  { env, service, version }: { env: E; service: S; version: V },
) => {
  const issues = Object.entries({
    [env]: validate.env(data?.[env]),
    [service]: validate.nonEmptyString(data?.[service]),
    [version]: validate.nonEmptyString(data?.[version]),
  });

  return new Error(
    [
      preamble,
      ...issues.flatMap(([key, issue]) => (issue ? `${key}: ${issue}` : [])),
    ].join('\n'),
  );
};

const getBaseOrThrow = <CustomLevels extends string>(
  opts: Extract<CreateOptions<CustomLevels>, { eeeoh: object }>,
) => {
  const result = parseBase(sourceBaseValues(opts));

  if (!result.error) {
    const { env, service, version } = result.value;

    return {
      ddsource: 'nodejs',
      ddtags: ddtags({ env, version }),
      env,
      service,
      version,
    };
  }

  if ('use' in opts.eeeoh && opts.eeeoh.use === 'environment') {
    throw newValidationError(
      '@seek/logger found invalid values in environment variables. Review the documentation and ensure your deployment configures these correctly.',
      process.env,
      { env: 'DD_ENV', service: 'DD_SERVICE', version: 'DD_VERSION' },
    );
  }

  throw newValidationError(
    '@seek/logger found invalid values in base attributes. Review the documentation and ensure your deployment configures these correctly.',
    opts.base,
    { env: 'env', service: 'service', version: 'version' },
  );
};

type CreateOptions<CustomLevels extends string> = Options<CustomLevels> &
  Pick<pino.LoggerOptions<CustomLevels>, 'mixin' | 'mixinMergeStrategy'>;

export const createOptions = <CustomLevels extends string>(
  opts: CreateOptions<CustomLevels>,
): Pick<
  pino.LoggerOptions<CustomLevels>,
  'base' | 'errorKey' | 'mixin' | 'mixinMergeStrategy'
> => {
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

  const original = {
    mixinMergeStrategy: opts.mixinMergeStrategy,
    mixin: opts.mixin,
  };

  const base = opts.eeeoh ? getBaseOrThrow(opts) : undefined;

  return {
    base,

    errorKey: opts.eeeoh ? 'error' : 'err',

    mixin: (mergeObject, level, logger) => {
      const tier = getTier(mergeObject, level, logger);

      return {
        ...original.mixin?.(mergeObject, level, logger),

        // Take precedence over the user-provided `mixin` for the `eeeoh` property
        ...formatOutput(tier),
      };
    },

    mixinMergeStrategy: (mergeObject, mixinObject) => {
      const retain = 'eeeoh' in mixinObject ? { eeeoh: mixinObject.eeeoh } : {};

      let merged =
        original.mixinMergeStrategy?.(mergeObject, mixinObject) ??
        Object.assign(mixinObject, mergeObject);

      if ('eeeoh' in merged && 'err' in merged && !('error' in merged)) {
        const { err, ...rest } = merged;
        merged = { error: err, ...rest };
      }

      // Mutation would be faster, but it's unlikely to matter too much.
      // Use a shallow clone for safety.
      return { ...merged, ...retain };
    },
  };
};
