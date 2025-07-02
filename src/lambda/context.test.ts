import { lambdaContextStorage } from './context';

describe('lambdaContextStorage', () => {
  it('should set and get context', () => {
    const context = { awsRequestId: 'test-123', customKey: 'value' };
    lambdaContextStorage.setContext(context);
    const retrievedContext = lambdaContextStorage.getContext();
    expect(retrievedContext).toEqual(context);
  });

  it('should update context', () => {
    const initialContext = { awsRequestId: 'test-123', customKey: 'value' };
    lambdaContextStorage.setContext(initialContext);

    const updateValues = { customKey: 'newValue', anotherKey: 'anotherValue' };
    lambdaContextStorage.updateContext(updateValues);

    const updatedContext = lambdaContextStorage.getContext();
    expect(updatedContext).toEqual({
      awsRequestId: 'test-123',
      customKey: 'newValue',
      anotherKey: 'anotherValue',
    });
  });
});
