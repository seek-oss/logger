import { lambdaContextStorage } from './context';
import { createLambdaContextCapture } from './request';

describe('createLambdaContextCapture', () => {
  it('should set the context with awsRequestId', () => {
    const captureContext = createLambdaContextCapture();
    const event = {};
    const context = { awsRequestId: '12345' };

    captureContext(event, context);

    const ctx = lambdaContextStorage.getContext();
    expect(ctx).toEqual({ awsRequestId: '12345' });
  });

  it('should apply custom request mixin', () => {
    type MyEvent = {
      key: string;
    };

    const captureContext = createLambdaContextCapture<MyEvent>({
      requestMixin: (event, context) => ({
        customEventKey: event.key,
        customContextKey: context.awsRequestId,
      }),
    });
    const event = { key: 'value' };
    const context = { awsRequestId: '12345' };

    captureContext(event, context);

    const ctx = lambdaContextStorage.getContext();
    expect(ctx).toEqual({
      awsRequestId: '12345',
      customEventKey: 'value',
      customContextKey: '12345',
    });
  });
});
