import pino from 'pino';

import {
  DEFAULT_MOCK_OPTIONS,
  type MockOptions,
  createStdoutMock,
} from './mock';

type CreateDestinationOptions = {
  /**
   * Whether to mock the destination.
   *
   * If this is set to a truthy value, logging calls will be intercepted and
   * recorded for later inspection.
   */
  mock: MockOptions | boolean;
};

/**
 * Helper function to create a logging destination.
 *
 * If the `mock` parameter is set to a truthy value, logging calls will be
 * intercepted and recorded for later inspection.
 *
 * Returns:
 *
 * - A `destination` to be supplied to the second parameter of `createLogger()`
 * - A `stdoutMock` recorder for testing and troubleshooting logging calls
 *
 * `[beta]` This feature is ready for adoption, but based on initial feedback,
 * its interface may be revised in a future major version.
 */
export const createDestination = Object.assign(
  (opts: CreateDestinationOptions) => {
    const stdoutMock = createStdoutMock(
      typeof opts.mock === 'object' ? opts.mock : DEFAULT_MOCK_OPTIONS,
    );

    const destination: pino.DestinationStream = opts.mock
      ? stdoutMock
      : pino.destination({ sync: true });

    return {
      destination,
      stdoutMock,
    };
  },
  {
    /**
     * The default options applied when creating a destination.
     *
     * These can be accessed to build on top of the defaults.
     */
    defaults: { mock: DEFAULT_MOCK_OPTIONS },
  },
);
