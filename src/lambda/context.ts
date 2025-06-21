const CONTEXT_SYMBOL = Symbol.for('aws.lambda.runtime.context');

interface GlobalContext {
  [CONTEXT_SYMBOL]: ContextMap;
}

export interface ContextMap {
  awsRequestId: string;
  [key: string]: unknown;
}

export interface ContextStorageProvider {
  getContext: () => ContextMap;
  setContext: (map: ContextMap) => void;
  updateContext: (values: Record<string, unknown>) => void;
}

export const lambdaContextStorageProvider: ContextStorageProvider = {
  getContext: () => (global as unknown as GlobalContext)[CONTEXT_SYMBOL],
  setContext: (map: ContextMap) =>
    ((global as unknown as GlobalContext)[CONTEXT_SYMBOL] = map),
  updateContext: (values: Record<string, unknown>) => {
    const ctx = lambdaContextStorageProvider.getContext();
    (global as unknown as GlobalContext)[CONTEXT_SYMBOL] = {
      ...ctx,
      ...values,
    };
  },
};
