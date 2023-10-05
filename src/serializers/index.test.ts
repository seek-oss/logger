import {
  type Request,
  createSerializers,
  defaultOmitHeaderNames,
} from './index';

const serializers = createSerializers({});

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
    ${'function'} | ${() => undefined}
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
    scenario                                                 | inputRemoteAddress | inputRemotePort
    ${'de-nests null socket.remoteAddress'}                  | ${null}            | ${undefined}
    ${'de-nests null socket.remotePort'}                     | ${undefined}       | ${null}
    ${'de-nests socket.remoteAddress'}                       | ${remoteAddress}   | ${undefined}
    ${'de-nests socket.remotePort'}                          | ${undefined}       | ${remotePort}
    ${'de-nests socket.remoteAddress and socket.remotePort'} | ${remoteAddress}   | ${remotePort}
  `('$scenario', ({ inputRemoteAddress, inputRemotePort }) => {
    const value = {
      ...requestBase,
      socket: {
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
    scenario                               | value
    ${'socket is missing'}                 | ${{ ...requestBase }}
    ${'socket is null'}                    | ${{ ...requestBase, socket: null }}
    ${'socket is undefined'}               | ${{ ...requestBase, socket: undefined }}
    ${'socket is empty object'}            | ${{ ...requestBase, socket: {} }}
    ${'socket.remoteAddress is undefined'} | ${{ ...requestBase, socket: { remoteAddress: undefined } }}
    ${'socket.remotePort is undefined'}    | ${{ ...requestBase, socket: { remotePort: undefined } }}
    ${'remoteAddress is a root property'}  | ${{ ...requestBase, remoteAddress }}
    ${'remotePort is a root property'}     | ${{ ...requestBase, remotePort }}
  `('remoteAddress and remotePort is undefined when $scenario', ({ value }) => {
    const result = serializers.req(value);

    expect(result).toStrictEqual({ ...expectedRequestBase });
  });

  it('omits defaultOmitHeaderNames by default', () => {
    const objectWithDefaultOmitHeaderNameKeys = defaultOmitHeaderNames.reduce(
      (headers, key) => ({ ...headers, [key]: 'header value' }),
      {},
    );
    const request = {
      ...requestBase,
      headers: {
        ...requestBase.headers,
        ...objectWithDefaultOmitHeaderNameKeys,
      },
    } as Partial<Request> as Request;
    const result = serializers.req(request);

    expect(result).toStrictEqual({ ...expectedRequestBase });
  });

  it('omits only specified headers when omitHeaderNames is provided', () => {
    const objectWithDefaultOmitHeaderNameKeys = defaultOmitHeaderNames.reduce(
      (headers, key) => ({ ...headers, [key]: 'header value' }),
      {},
    );
    const request = {
      ...requestBase,
      headers: {
        ...requestBase.headers,
        ['omit-me']: 'header value',
        ...objectWithDefaultOmitHeaderNameKeys,
      },
    } as Partial<Request> as Request;

    const expectedRequest = {
      ...expectedRequestBase,
      headers: {
        ...requestBase.headers,
        ...objectWithDefaultOmitHeaderNameKeys,
      },
    };

    const altSerializers = createSerializers({ omitHeaderNames: ['omit-me'] });
    const result = altSerializers.req(request);

    expect(result).toStrictEqual(expectedRequest);
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
