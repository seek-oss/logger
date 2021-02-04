import serializers from './index';

describe('req', () => {
  const remoteAddress = '::ffff:123.45.67.89';
  const remotePort = 12345;

  const requestBase = {
    method: 'GET',
    url: 'https://example.com/13579',
    headers: {
      host: 'example.com',
      'x-request-id': 'bbf9537d-3cf0-4acf-9b74-47de1e4aeca4',
    },
  };

  const expectedRequestBase = {
    ...requestBase,
    remoteAddress: undefined,
    remotePort: undefined,
  };

  test.each`
    scenario       | value
    ${'number'}    | ${42}
    ${'string'}    | ${'Hand towel'}
    ${'boolean'}   | ${true}
    ${'undefined'} | ${undefined}
    ${'null'}      | ${null}
  `('returns input $scenario when value is not an object', ({ value }) => {
    const result = serializers.req(value);

    expect(result).toBe(value);
  });

  test.each`
    scenario      | value
    ${'function'} | ${() => {}}
    ${'array'}    | ${[{ answer: 42 }]}
  `('returns empty req when value is $scenario', ({ value }) => {
    const result = serializers.req(value);

    expect(result).toStrictEqual({
      method: undefined,
      url: undefined,
      headers: undefined,
      remoteAddress: undefined,
      remotePort: undefined,
    });
  });

  test.each`
    scenario                                                         | inputRemoteAddress | inputRemotePort
    ${'de-nests null connection.remoteAddress'}                      | ${null}            | ${undefined}
    ${'de-nests null connection.remotePort'}                         | ${undefined}       | ${null}
    ${'de-nests connection.remoteAddress'}                           | ${remoteAddress}   | ${undefined}
    ${'de-nests connection.remotePort'}                              | ${undefined}       | ${remotePort}
    ${'de-nests connection.remoteAddress and connection.remotePort'} | ${remoteAddress}   | ${remotePort}
  `('$scenario', ({ inputRemoteAddress, inputRemotePort }) => {
    const value = {
      ...requestBase,
      connection: {
        remoteAddress: inputRemoteAddress,
        remotePort: inputRemotePort,
      },
    };

    const result = serializers.req(value);

    expect(result).toStrictEqual({
      ...expectedRequestBase,
      remoteAddress: inputRemoteAddress,
      remotePort: inputRemotePort,
    });
  });

  test.each`
    scenario                                   | value
    ${'connection is missing'}                 | ${{ ...requestBase }}
    ${'connection is null'}                    | ${{ ...requestBase, connection: null }}
    ${'connection is undefined'}               | ${{ ...requestBase, connection: undefined }}
    ${'connection is empty object'}            | ${{ ...requestBase, connection: {} }}
    ${'connection.remoteAddress is undefined'} | ${{ ...requestBase, connection: { remoteAddress: undefined } }}
    ${'connection.remotePort is undefined'}    | ${{ ...requestBase, connection: { remotePort: undefined } }}
    ${'remoteAddress is a root property'}      | ${{ ...requestBase, remoteAddress }}
    ${'remotePort is a root property'}         | ${{ ...requestBase, remotePort }}
  `('remoteAddress and remotePort is undefined when $scenario', ({ value }) => {
    const result = serializers.req(value);

    expect(result).toStrictEqual({ ...expectedRequestBase });
  });
});

describe('res', () => {
  const statusCode = 200;

  const headersBase = {
    location: 'https://example.com/13579',
    'x-request-id': 'bbf9537d-3cf0-4acf-9b74-47de1e4aeca4',
  };

  test.each`
    scenario        | value
    ${'statusCode'} | ${{ statusCode }}
    ${'status'}     | ${{ status: statusCode }}
  `('maps $scenario', ({ value }) => {
    const result = serializers.res(value);

    expect(result).toStrictEqual({ statusCode, headers: undefined });
  });

  test.each`
    scenario     | value
    ${'_header'} | ${{ _header: { ...headersBase } }}
    ${'header'}  | ${{ header: { ...headersBase } }}
    ${'headers'} | ${{ headers: { ...headersBase } }}
  `('maps $scenario', ({ value }) => {
    const result = serializers.res(value);

    expect(result).toStrictEqual({
      statusCode: undefined,
      headers: { ...headersBase },
    });
  });
});
