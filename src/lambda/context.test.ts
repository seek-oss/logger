import { lambdaContextStorageProvider } from './context';

describe('lambdaContextStorageProvider', () => {
  it('should set and get context', () => {
    const context = { awsRequestId: 'test-123', customKey: 'value' };
    lambdaContextStorageProvider.setContext(context);
    const retrievedContext = lambdaContextStorageProvider.getContext();
    expect(retrievedContext).toEqual(context);
  });

  it('should update context', () => {
    const initialContext = { awsRequestId: 'test-123', customKey: 'value' };
    lambdaContextStorageProvider.setContext(initialContext);

    const updateValues = { customKey: 'newValue', anotherKey: 'anotherValue' };
    lambdaContextStorageProvider.updateContext(updateValues);

    const updatedContext = lambdaContextStorageProvider.getContext();
    expect(updatedContext).toEqual({
      awsRequestId: 'test-123',
      customKey: 'newValue',
      anotherKey: 'anotherValue',
    });
  });
});
