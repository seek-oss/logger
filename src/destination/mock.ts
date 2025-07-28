import fastRedact from 'fast-redact';

type Call = Readonly<Record<PropertyKey, unknown>>;

const isCall = (value: unknown): value is Call =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

export type MockOptions = {
  /**
   * Properties to replace with a static `-` before recording the logging call.
   *
   * List non-determistic properties like `latency` to stabilise snapshots.
   *
   * See `fast-redact` for supported syntax:
   * https://github.com/davidmarkclements/fast-redact/blob/v3.5.0/readme.md#paths--array
   */
  redact?: string[];

  /**
   * Properties to remove before recording the logging call.
   *
   * List common properties like `timestamp` to declutter test assertions.
   *
   * See `fast-redact` for supported syntax:
   * https://github.com/davidmarkclements/fast-redact/blob/v3.5.0/readme.md#paths--array
   */
  remove?: string[];
};

export const DEFAULT_MOCK_OPTIONS = Object.freeze({
  redact: [
    'headers["host"]',
    'headers["x-request-id"]',
    'latency',
    '["x-request-id"]',
  ],

  remove: ['environment', 'name', 'timestamp', 'version', 'eeeoh', 'ddsource'],
} as const satisfies MockOptions);

export const createStdoutMock = (opts: MockOptions) => {
  const redact = fastRedact({
    censor: '-',
    paths: opts.redact ?? DEFAULT_MOCK_OPTIONS.redact,
    serialize: false,
    remove: false,
    strict: true,
  });

  const remove = fastRedact({
    censor: undefined,
    paths: opts.remove ?? DEFAULT_MOCK_OPTIONS.remove,
    serialize: JSON.stringify,
    remove: true,
    strict: true,
  });

  const calls: Call[] = [];

  return {
    /**
     * The list of logging calls recorded to date.
     *
     * This may be asserted against in a test case.
     *
     * ```typescript
     * expect(stdoutMock.calls).toMatchSnapshot();
     * ```
     */
    calls,

    /**
     * Convenience method to clear the logging calls recorded to date.
     *
     * This may be hooked up to a test runner lifecycle event.
     *
     * ```typescript
     * afterEach(stdoutMock.clear);
     * ```
     */
    clear: (): void => {
      calls.length = 0;
    },

    /**
     * Convenience method to retrieve a solitary logging call.
     *
     * Throws an error if more or less than 1 call has been recorded.
     *
     * This may be asserted against in a test case.
     *
     * ```typescript
     * expect(stdoutMock.onlyCall()).toMatchSnapshot();
     * ```
     */
    onlyCall: (): Call => {
      const { 0: first, length } = calls;

      if (!first || length > 1) {
        throw new Error(
          `stdoutMock.onlyCall() found ${length} calls; expected exactly 1`,
        );
      }

      return first;
    },

    /**
     * Underlying method that `@seek/logger` calls to persist logs.
     */
    write: (msg: string): void => {
      let call: unknown = JSON.parse(msg);

      const result = remove(call);

      call = JSON.parse(String(result));

      if (!isCall(call)) {
        throw new Error(
          `@seek/logger mocking failed to process a log message: ${msg}`,
        );
      }

      redact(call);

      calls.push(call);
    },
  };
};
