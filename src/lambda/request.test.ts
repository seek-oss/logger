import { lambdaContextStorageProvider } from './context';
import { createLambdaContextTracker } from './request';

describe('createLambdaContextTracker', () => {
  it('should set the context with awsRequestId', () => {
    const withRequest = createLambdaContextTracker();
    const event = {};
    const context = { awsRequestId: '12345' };

    withRequest(event, context);

    const ctx = lambdaContextStorageProvider.getContext();
    expect(ctx).toEqual({ awsRequestId: '12345' });
  });

  it('should apply custom request mixin', () => {
    type MyEvent = {
      key: string;
    };

    const withRequest = createLambdaContextTracker<MyEvent>({
      requestMixin: (event, context) => ({
        customEventKey: event.key,
        customContextKey: context.awsRequestId,
      }),
    });
    const event = { key: 'value' };
    const context = { awsRequestId: '12345' };

    withRequest(event, context);

    const ctx = lambdaContextStorageProvider.getContext();
    expect(ctx).toEqual({
      awsRequestId: '12345',
      customEventKey: 'value',
      customContextKey: '12345',
    });
  });
});
