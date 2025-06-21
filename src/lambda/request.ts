import { type ContextMap, lambdaContextStorageProvider } from './context';

export interface LambdaContext {
  awsRequestId: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface LambdaEvent {}

export interface LambdaContextTrackerOptions<
  TEvent extends LambdaEvent = LambdaEvent,
  TContext extends LambdaContext = LambdaContext,
> {
  /**
   * Per request level mixin with access to the Lambda
   * event and context information for each request
   */
  requestMixin?: (event: TEvent, context: TContext) => Record<string, unknown>;
}

/**
 * Creates a function for capturing Lambda request context across logging calls
 * @param options The request options
 */
export const createLambdaContextTracker =
  <
    TEvent extends LambdaEvent = LambdaEvent,
    TContext extends LambdaContext = LambdaContext,
  >(
    options: LambdaContextTrackerOptions<TEvent, TContext> = {},
  ) =>
  (event: TEvent, context: TContext): void => {
    const ctx: ContextMap = {
      awsRequestId: context.awsRequestId,
    };

    // handle custom request level mixins
    if (options.requestMixin) {
      const result = options.requestMixin(event, context);
      Object.assign(ctx, result);
    }

    lambdaContextStorageProvider.setContext(ctx);
  };
