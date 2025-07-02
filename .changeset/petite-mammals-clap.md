---
'@seek/logger': minor
---

Add support for capturing Lambda context in logs. This allows for consistent tracing and correlation across serverless functions.

```typescript
import createLogger, {
  createLambdaContextCapture,
  lambdaContextStorage,
} from '@seek/logger';

const captureContext = createLambdaContextCapture();

const logger = createLogger({
  name: 'my-lambda-service',
  mixin: () => ({
    ...lambdaContextStorage.getContext(),
  }),
});

export const handler = async (event, context) => {
  captureContext(event, context);

  // All logs will now automatically include the Lambda context
  logger.info('Lambda function invoked');
  // { "awsRequestId": "12345", "message": "Lambda function invoked" }
};
```

Please check the README for more details.
