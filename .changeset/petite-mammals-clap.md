---
'@seek/logger': minor
---

Add support for capturing Lambda context in logs. This allows for consistent tracing and correlation across serverless functions.

```typescript
import createLogger, {
  createLambdaContextCapture,
  lambdaContextStorage,
} from '@seek/logger';

// Create a context capture function
const captureContext = createLambdaContextCapture();

// Configure logger to include the context in all logs
const logger = createLogger({
  name: 'my-lambda-service',
  mixin: () => ({
    ...lambdaContextStorage.getContext(),
  }),
});

// Lambda handler with automated context capture
export const handler = async (event, context) => {
  // Capture the Lambda context at the start of each invocation
  captureContext(event, context);

  // All logs will now automatically include the Lambda context
  logger.info('Lambda function invoked');
  // { "awsRequestId": "12345", "message": "Lambda function invoked" }
};
```

Please check the README for more details.
