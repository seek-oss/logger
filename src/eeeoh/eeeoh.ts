import pino from 'pino';
import * as S from 'sury';

import { ddtags } from './ddtags.js';

export const envs = ['development', 'production', 'sandbox', 'test'] as const;

export type Env = (typeof envs)[number];

const nonEmptyString = S.trim(S.min(S.string, 1, 'String cannot be empty'));

const parseNonEmptyString = S.compile(nonEmptyString, 'Any', 'Output', 'Sync');

const baseSchema = S.schema({
  env: nonEmptyString,
  service: nonEmptyString,
  version: nonEmptyString,
});

const parseBase = S.compile(baseSchema, 'Any', 'Output', 'Sync');

type ParseBase = ReturnType<typeof parseBase>;

const datadogTierSchema = S.union([
  'zero',
  'tin',
  'tin-plus',
  'tin-plus-plus',
  'bronze',
  'bronze-plus',
  'bronze-plus-plus',
  'silver',
  'silver-plus',
  'silver-plus-plus',
]);

export type DatadogTier = S.Output<typeof datadogTierSchema>;

export type DatadogConfig<CustomLevels extends string = never> =
  | DatadogTier
  | [DatadogTier, Partial<Record<CustomLevels | pino.Level, DatadogTier>>]
  | false;

type LevelToTier = (level: number) => DatadogTier | false | null;

const tierByLevelMapSchema: S.Schema<Partial<Record<string, DatadogTier>>> =
  S.record(datadogTierSchema);

const datadogTierByLevelSchema = S.schema([
  datadogTierSchema,
  tierByLevelMapSchema,
]);

const eeeohConfigSchema = S.schema({
  datadog: S.union([datadogTierSchema, datadogTierByLevelSchema, false]),
  team: S.optional(nonEmptyString),
});

const parseEeeohConfig = S.compile(eeeohConfigSchema, 'Any', 'Output', 'Sync');

const eeeohFieldSchema = S.schema({
  datadog: S.union([datadogTierSchema, false]),
  team: S.optional(nonEmptyString),
});

const parseEeeohField = S.compile(eeeohFieldSchema, 'Any', 'Output', 'Sync');

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

  /**
   * The owner of the component or specific log.
   *
   * This can attribute costs and correlate telemetry across multiple services.
   */
  team?: string;
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

    team?: string;
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
  env: Env | (string & {});

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
             * `environment` is the recommended approach of sourcing application
             * metadata from the workload hosting environment to annotate logs.
             *
             * Automat v1+ workload hosting automatically adds base attributes
             * to your logs through a telemetry agent. You do not need to
             * manually set `DD_` environment variables in this environment.
             *
             * AWS Lambda requires your deployment configuration to manually
             * propagate the following environment variables:
             *
             * - `DD_ENV` - The environment that the component is deployed to,
             *   e.g. `production`.
             * - `DD_SERVICE` - The name of the component, or the service name
             *   override on a deployment of the component, e.g.
             *   `my-component-name` or `my-service-name-override`.
             * - `DD_VERSION` | `VERSION` - The unique identifier for the
             *   current deployment, e.g. `abcdefa.123`.
             *
             * Gantry workload hosting requires your deployment configuration to
             * manually propagate `DD_ENV` and `DD_SERVICE`.
             *
             * Carefully set these to enable correlation of observability data.
             * An error is thrown if an environment variable is set to an
             * invalid value (e.g. an empty string), as we recommend failing
             * fast over silently continuing in a misconfigured state.
             *
             * See the documentation for more information:
             * https://github.com/seek-oss/logger/blob/master/docs/eeeoh.md
             */
            use: 'environment';
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

const formatOutput = (
  tier: DatadogTier | false | null,
  ddTags: string | undefined,
) => ({
  // Include `ddsource` in the absence of payload-level routing configuration.
  // This improves the Datadog experience for workloads that rely on external
  // routing configuration (e.g. via LogCentral).
  ...(tier === false ? {} : { ddsource: 'nodejs' }),

  ...(tier === false || tier === null || !ddTags ? {} : { ddtags: ddTags }),

  ...(tier === null
    ? {}
    : {
        eeeoh: {
          logs: {
            datadog:
              tier === false
                ? { enabled: false }
                : { enabled: true, tier: tier satisfies DatadogTier },
          },
        },
      }),
});

const getConfigForLogger = <CustomLevels extends string>(
  logger: pino.Logger<CustomLevels>,
): Config<CustomLevels> | null => {
  const eeeoh: unknown = logger.bindings().eeeoh;
  if (!eeeoh) {
    // Skip parsing if the `eeeoh` property is not present
    return null;
  }

  try {
    return parseEeeohConfig(eeeoh);
  } catch {
    return null;
  }
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
): Record<keyof ParseBase, unknown> | null => {
  if (!('use' in opts.eeeoh)) {
    return {
      env: opts.base?.env,
      service: opts.base?.service,
      version: opts.base?.version,
    };
  }

  switch (opts.eeeoh.use) {
    case 'environment':
      if (
        process.env.DD_ENV === undefined &&
        process.env.DD_SERVICE === undefined &&
        process.env.DD_VERSION === undefined
      ) {
        // Short circuit for Automat-like workload hosting environments where
        // base attributes are automatically added by telemetry agents.
        return null;
      }

      return {
        env: process.env.DD_ENV,
        service: process.env.DD_SERVICE,
        version:
          process.env.DD_VERSION ??
          // Fallback for Gantry which only sets `VERSION`
          process.env.VERSION,
      };
  }
};

const validate = {
  nonEmptyString: (value: unknown) => {
    try {
      parseNonEmptyString(value);
      return null;
    } catch {
      return `expected non-empty string, received ${JSON.stringify(value)}`;
    }
  },
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
    [env]: validate.nonEmptyString(data?.[env]),
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
  const baseValues = sourceBaseValues(opts);

  if (!baseValues) {
    return;
  }

  try {
    return parseBase(baseValues);
  } catch {
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
  }
};

type CreateOptions<CustomLevels extends string> = Options<CustomLevels> &
  Pick<pino.LoggerOptions<CustomLevels>, 'mixin' | 'mixinMergeStrategy'>;

export const createOptions = <CustomLevels extends string>(
  opts: CreateOptions<CustomLevels>,
): Pick<
  pino.LoggerOptions<CustomLevels>,
  'base' | 'errorKey' | 'mixin' | 'mixinMergeStrategy'
> => {
  type CacheableConfig = { levelToTier: LevelToTier; tags: string | undefined };

  const configCache = new WeakMap<pino.Logger<CustomLevels>, CacheableConfig>();

  const getCacheableConfig = (
    logger: pino.Logger<CustomLevels>,
  ): CacheableConfig => {
    // This cache implementation does not track out-of-band changes to the
    // logger binding, i.e. `logger.setBindings({ eeeoh: { /* ... */ } })`.
    // There should be no good reason to do that and we should discourage it.
    const cached = configCache.get(logger);
    if (cached) {
      return cached;
    }

    const { datadog, team } = getConfigForLogger(logger) ??
      opts.eeeoh ?? { datadog: null };

    const tags = ddtags({
      env: base?.env,
      team,
      version: base?.version,
    });

    if (datadog === false || datadog === null) {
      const config = {
        levelToTier: () => datadog,
        tags,
      } satisfies CacheableConfig;

      configCache.set(logger, config);

      return config;
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

    const config = {
      levelToTier: (level) =>
        // No known way of choosing a level that isn't in `logger.levels`
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        precomputations[level]!,
      tags,
    } satisfies CacheableConfig;

    configCache.set(logger, config);

    return config;
  };

  const getTagsAndTier = (
    input: object,
    level: number,
    logger: pino.Logger<CustomLevels>,
  ): { tags: string | undefined; tier: DatadogTier | false | null } => {
    let tier: DatadogTier | false | undefined;

    if ('eeeoh' in input) {
      try {
        const result = parseEeeohField(input.eeeoh);

        tier = result.datadog;

        if (result.team) {
          return {
            tags: ddtags({
              env: base?.env,
              team: result.team,
              version: base?.version,
            }),
            tier: result.datadog,
          };
        }
      } catch {}
    }

    const { levelToTier, tags } = getCacheableConfig(logger);

    return { tags, tier: tier ?? levelToTier(level) };
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
      const { tags, tier } = getTagsAndTier(mergeObject, level, logger);

      return {
        ...original.mixin?.(mergeObject, level, logger),
        // Take precedence over the user-provided `mixin` for the `eeeoh` & `ddtags` properties
        ...formatOutput(tier, tags),
      };
    },

    mixinMergeStrategy: (mergeObject, mixinObject) => {
      const retain = {
        ddsource: 'ddsource' in mixinObject ? mixinObject.ddsource : undefined,
        ddtags: 'ddtags' in mixinObject ? mixinObject.ddtags : undefined,
        eeeoh: 'eeeoh' in mixinObject ? mixinObject.eeeoh : undefined,
      };

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
