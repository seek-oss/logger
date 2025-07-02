---
'@seek/logger': minor
---

Add support for capturing Lambda context in logs. This allows for consistent tracing and correlation across serverless functions.

```typescript
import createLogger, {
  createLambdaContextCaptureTracker,
  lambdaContextStorageProvider,
} from '@seek/logger';

// Create a context capture function
const withRequest = createLambdaContextCaptureTracker();

// Configure logger to include the context in all logs
const logger = createLogger({
  name: 'my-lambda-service',
  mixin: () => ({
    ...lambdaContextStorageProvider.getContext(),
  }),
});

// Lambda handler with automated context capture
export const handler = async (event, context) => {
  // Capture the Lambda context at the start of each invocation
  withRequest(event, context);

  // All logs will now automatically include the Lambda context
  logger.info({ event }, 'Lambda function invoked');
};
```

Please check the [README] for more details.
