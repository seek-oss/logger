import { DEFAULT_OMIT_HEADER_NAMES, createSerializers } from '.';

const serializers = createSerializers({});

describe('DEFAULT_OMIT_HEADER_NAMES', () => {
  it('disallows mutation', () => {
    const firstElement = DEFAULT_OMIT_HEADER_NAMES[0];

    expect(() => {
      // @ts-expect-error - We're trying to break the read-only array (TS2542).
      DEFAULT_OMIT_HEADER_NAMES[0] = 'badness!';
    }).toThrowErrorMatchingInlineSnapshot(
      `"Cannot assign to read only property '0' of object '[object Array]'"`,
    );

    expect(() => {
      // @ts-expect-error - We're trying to break the read-only array (TS2542).
      // eslint-disable-next-line @typescript-eslint/no-array-delete
      delete DEFAULT_OMIT_HEADER_NAMES[0];
    }).toThrowErrorMatchingInlineSnapshot(
      `"Cannot delete property '0' of [object Array]"`,
    );

    // Assignment didn't take effect!
    expect(DEFAULT_OMIT_HEADER_NAMES[0]).toBe(firstElement);
  });
});

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

    expect(result).toStrictEqual(expectedRequestBase);
  });

  const objectWithDefaultOmitHeaderNameKeys = Object.fromEntries(
    DEFAULT_OMIT_HEADER_NAMES.map((headerName) => [headerName, 'header value']),
  );

  it('omits defaultOmitHeaderNames by default', () => {
    const request = {
      ...requestBase,
      headers: {
        ...requestBase.headers,
        ...objectWithDefaultOmitHeaderNameKeys,
      },
    };

    const result = serializers.req(request);

    expect(result).toStrictEqual(expectedRequestBase);
  });

  it('omits only specified headers when omitHeaderNames is provided', () => {
    const request = {
      ...requestBase,
      headers: {
        ...requestBase.headers,
        ['omit-me']: 'header value',
        ...objectWithDefaultOmitHeaderNameKeys,
      },
    };

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

describe('serializers', () => {
  test('it exports the expected properties', () => {
    expect(serializers).toMatchInlineSnapshot(`
      {
        "err": [Function],
        "errWithCause": [Function],
        "headers": [Function],
        "req": [Function],
        "res": [Function],
      }
    `);
  });
});
