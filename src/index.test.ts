import split from 'split2';

import createLogger, { LoggerOptions } from '.';

const bearerToken =
  'Bearer 123asdh12312312312312323232123asdh12312312312312323232';
const redactedBearer = '[Redacted]';

const getHeaderWithAuth = (redacted?: boolean) => `GET /brands/10044680 HTTP/1.1
Accept: application/json, text/plain, */*
authorization: ${redacted ? redactedBearer : bearerToken}`;

const sink = () =>
  split((data) => {
    try {
      return JSON.parse(data);
    } catch (err) {
      console.log(err); // eslint-disable-line
      console.log(data); // eslint-disable-line
    }
  });

function once(emitter: any, name: any) {
  return new Promise((resolve, reject) => {
    if (name !== 'error') {
      emitter.once('error', reject);
    }
    emitter.once(name, (arg: unknown) => {
      emitter.removeListener('error', reject);
      resolve(arg);
    });
  });
}

function testLog(
  testName: string,
  input: any,
  output: any,
  method?: 'error' | 'info',
  loggerOptions?: LoggerOptions,
) {
  // eslint-disable-next-line jest/valid-title
  test(testName, async () => {
    const inputString = JSON.stringify(input);
    const stream = sink();
    const logger = createLogger({ name: 'my-app', ...loggerOptions }, stream);
    logger[method ?? 'info'](input);

    const log: any = await once(stream, 'data');
    expect(log).toMatchObject(output);
    expect(inputString).toEqual(JSON.stringify(input));
    expect(log).toHaveProperty('timestamp');
  });
}

test('it adds user defined base items to the log', async () => {
  const stream = sink();
  const logger = createLogger(
    {
      name: 'my-app',
      base: { userDefinedBase: 'example value' },
    },
    stream,
  );
  logger.info('Test log entry');
  const log: any = await once(stream, 'data');
  expect(log.userDefinedBase).toBe('example value');
});

testLog(
  'should log info',
  { key: { foo: 'bar' } },
  {
    name: 'my-app',
    key: { foo: 'bar' },
    level: 30,
  },
);

testLog(
  'should log error',
  { key: { foo: 'bar' } },
  {
    name: 'my-app',
    key: { foo: 'bar' },
    level: 50,
  },
  'error',
);

testLog(
  'should serialise request when it is a string',
  { req: 'bar' },
  { req: 'bar' },
);

testLog(
  'should serialise response when it is a string',
  { res: 'foo' },
  { res: 'foo' },
);

testLog(
  'should serialise request when it is an object',
  {
    req: {
      method: 'POST',
      url: 'url',
      headers: {
        a: 1,
        authorization: bearerToken,
      },
      c: 3,
      socket: { remoteAddress: '123.234', remotePort: 9999 },
    },
  },
  {
    req: {
      remoteAddress: '123.234',
      remotePort: 9999,
      method: 'POST',
      url: 'url',
      headers: {
        a: 1,
        authorization: '[Redacted]',
      },
    },
  },
);

testLog(
  'should serialise response when it is an object',
  {
    res: {
      headers: { Origin: 'www.seek.com.au' },
      status: 500,
      foo: 'baz',
    },
  },
  {
    res: {
      headers: { Origin: 'www.seek.com.au' },
      statusCode: 500,
    },
  },
);

testLog(
  'should truncate objects deeper than the default depth of 4 levels',
  { req: { url: { c: { d: { e: { f: { g: {} } } } } } } },
  { req: { url: { c: { d: '[Object]' } } } },
);

testLog(
  'should truncate objects deeper than the configured object depth',
  { req: { url: { c: { d: { e: { f: { g: {} } } } } } } },
  { req: { url: { c: { d: { e: '[Object]' } } } } },
  undefined,
  { maxObjectDepth: 5 },
);

testLog(
  'should truncate Buffers',
  {
    res: {
      statusCode: Buffer.from('aaa'),
    },
  },
  { res: { statusCode: 'Buffer(3)' } },
);

testLog(
  'should truncate strings longer than 512 characters',
  { req: { url: 'a'.repeat(555) } },
  { req: { url: `${'a'.repeat(512)}...` } },
);

testLog(
  'should truncate arrays containing more than 64 items',
  { err: { message: 'a'.repeat(64 + 10).split('') } },
  {
    err: {
      message: 'Array(74)',
    },
  },
);

testLog(
  'should not truncate arrays containing up to 64 items',
  { err: { message: 'a'.repeat(64).split('') } },
  {
    err: {
      message: 'a'.repeat(64).split(''),
    },
  },
);

const manyProps = '?'
  .repeat(63)
  .split('?')
  .reduce(
    (previousValue, _, currentIndex) => ({
      ...previousValue,
      [`prop${currentIndex}`]: currentIndex,
    }),
    {} as Record<string, number>,
  );

testLog(
  'should allow up to 64 object properties',
  { props: manyProps },
  { props: manyProps },
);

testLog(
  'should use string representation when object has more than 64 properties',
  { props: { ...manyProps, OneMoreProp: '>_<' } },
  { props: 'Object(65)' },
);

testLog(
  'should log error',
  {
    error: new Error('Ooh oh! Something went wrong'),
    err: new Error('Woot! Another one!'),
    foo: new Error('Oh my, this is an error too!'),
  },
  {
    error: { message: 'Ooh oh! Something went wrong' },
    err: { message: 'Woot! Another one!' },
    foo: { message: 'Oh my, this is an error too!' },
  },
);

testLog(
  'should redact reqHeaders object',
  {
    reqHeaders: {
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'accept-encoding': 'gzip, deflate',
      'accept-language': 'en-us',
      authorization:
        'Bearer 1e990fc0eb86b24e3088aa1b6acad88301f26725970f46dfdfe56ae2ff2fceb9',
      cookie:
        'JobseekerVisitorId=5c4cf2b5-6ce3-45ef-8b62-ebecf2f45ef5; JobseekerSessionId=37a99195-8cee-4071-b748-7e52b0ff0e5b',
      host: 'www.seek.com.au',
      referer:
        'https://au.jora.com/job/concrete-pump-operator-7f075c6f5a274adf2d87af62fcd18334?from_url=https%3A%2F%2Fau.jora.com%2Faccount%2Fsaved_jobs%3Freturn_to%3Dhttps%3A%2F%2Fau.jora.com%2Faccount%2Fsaved_jobs%2F&sp=savedjobs&sponsored=false',
      'user-agent': 'Jora com.jora.Jobseeker/2.0.1 iOS/10.1.1 Apple/iPhone',
    },
  },
  {
    reqHeaders: {
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'accept-encoding': 'gzip, deflate',
      'accept-language': 'en-us',
      authorization: '[Redacted]',
      cookie:
        'JobseekerVisitorId=5c4cf2b5-6ce3-45ef-8b62-ebecf2f45ef5; JobseekerSessionId=37a99195-8cee-4071-b748-7e52b0ff0e5b',
      host: 'www.seek.com.au',
      referer:
        'https://au.jora.com/job/concrete-pump-operator-7f075c6f5a274adf2d87af62fcd18334?from_url=https%3A%2F%2Fau.jora.com%2Faccount%2Fsaved_jobs%3Freturn_to%3Dhttps%3A%2F%2Fau.jora.com%2Faccount%2Fsaved_jobs%2F&sp=savedjobs&sponsored=false',
      'user-agent': 'Jora com.jora.Jobseeker/2.0.1 iOS/10.1.1 Apple/iPhone',
    },
  },
);

testLog(
  'should redact ECONNABORTED error',
  {
    level: 40,
    req: {
      method: 'GET',
      headers: {
        authorization: '[Redacted]',
      },
    },
    err: {
      type: 'Error',
      message: 'timeout of 400ms exceeded',
      stack:
        'Error: timeout of 400ms exceeded\n    at createError (/var/app/node_modules/axios/lib/core/createError.js:16:15)\n    at Timeout.handleRequestTimeout [as _onTimeout] (/var/app/node_modules/axios/lib/adapters/http.js:216:16)\n    at ontimeout (timers.js:498:11)\n    at tryOnTimeout (timers.js:323:5)\n    at Timer.listOnTimeout (timers.js:290:5)',
      config: {
        timeout: 400,
        headers: {
          Accept: 'application/json, text/plain, */*',
          authorization:
            'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImNoYWxpY2UtZXhwZXJpZW5jZS4yMDE5MDUwN1QwNDQwNDBaIn0.eyJpYXQiOjE1NjI2MzAxNTcsImV4cCI6MTU2MjYzMzc1NywiYXVkIjoiY2Etam9iZGV0YWlscy1yZXNvdXJjZS1hcGkiLCJpc3MiOiJjaGFsaWNlLWV4cGVyaWVuY2UifQ.UdnriqfKRXwUHwaCIUw8Q15h3T7f2nxGbxgVJbC9MUQvNCvl1Y_1DDr5ZSE1Ugu-e-RpfJqDw7xStWyaemRXotRuNuaYw4PwddiQcVxOVHaQXldyoBRaYTcXm0RRZIX5unVgNR3IA53uQH0Cq3buuW3kfFuI6kpUC5uyIxQ8WBWuYDgbgQvaMy2748YaYMfxEjnw-jntthbOHFS5EOVThxqeeAOfVvPUH3dNBn7gK314lM1JgUCbnRVo8AJK6y7J9axuYgjX9IxCOL66caF5QH...',
        },
      },
      code: 'ECONNABORTED',
      request: {
        domain: null,
        _options: {
          method: 'get',
          headers: {
            Accept: 'application/json, text/plain, */*',
            authorization:
              'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImNoYWxpY2UtZXhwZXJpZW5jZS4yMDE5MDUwN1QwNDQwNDBaIn0.eyJpYXQiOjE1NjI2MzAxNTcsImV4cCI6MTU2MjYzMzc1NywiYXVkIjoiY2Etam9iZGV0YWlscy1yZXNvdXJjZS1hcGkiLCJpc3MiOiJjaGFsaWNlLWV4cGVyaWVuY2UifQ.UdnriqfKRXwUHwaCIUw8Q15h3T7f2nxGbxgVJbC9MUQvNCvl1Y_1DDr5ZSE1Ugu-e-RpfJqDw7xStWyaemRXotRuNuaYw4PwddiQcVxOVHaQXldyoBRaYTcXm0RRZIX5unVgNR3IA53uQH0Cq3buuW3kfFuI6kpUC5uyIxQ8WBWuYDgbgQvaMy2748YaYMfxEjnw-jntthbOHFS5EOVThxqeeAOfVvPUH3dNBn7gK314lM1JgUCbnRVo8AJK6y7J9axuYgjX9IxCOL66caF5QH...',
          },
        },
      },
    },
    meta: { message: 'timeout of 400ms exceeded', attempt: 0 },
    msg: 'Retrying Request',
    v: 1,
  },
  {
    req: {
      method: 'GET',
      headers: {
        authorization: '[Redacted]',
      },
    },
    err: {
      config: {
        headers: {
          Accept: 'application/json, text/plain, */*',
          authorization: '[Redacted]',
        },
      },
      request: {
        _options: {
          method: 'get',
          headers: '[Object]',
        },
      },
    },
  },
);

testLog(
  'should redact any bearer tokens',
  {
    reqHeaders: {
      authorization: bearerToken,
    },
    err: {
      config: {
        headers: {
          authorization: bearerToken,
        },
      },
      request: {
        _header: getHeaderWithAuth(),
      },
    },
    req: {
      headers: {
        authorization: bearerToken,
      },
    },
    error: {
      request: {
        _currentRequest: {
          _header: getHeaderWithAuth(),
        },
      },
    },
  },
  {
    reqHeaders: {
      authorization: redactedBearer,
    },
    err: {
      config: {
        headers: {
          authorization: redactedBearer,
        },
      },
      request: {
        _header: getHeaderWithAuth(true),
      },
    },
    req: {
      headers: {
        authorization: redactedBearer,
      },
    },
    error: {
      request: {
        _currentRequest: {
          _header: getHeaderWithAuth(true),
        },
      },
    },
  },
);

testLog(
  'allow consumers access to the full text log for redaction',
  {
    err: {
      response: {
        config: {
          data: 'client_secret=super_secret_client_secret&audience=https%3A%2F%2Fseek%2Fapi%2Fcandidate',
        },
      },
    },
  },
  {
    err: {
      response: {
        config: {
          data: 'client_secret=[Redacted]&audience=https%3A%2F%2Fseek%2Fapi%2Fcandidate',
        },
      },
    },
  },
  'info',
  {
    redactText: (input, redactionPlaceholder) => {
      const regex = /\b(client_secret=)([^&]+)/gi;
      return input.replace(
        regex,
        (_, group1) => `${group1 as unknown as string}${redactionPlaceholder}`,
      );
    },
  },
);

interface ExampleMessageContext {
  activity: string;
  err?: {
    message: string;
  };
  input?: Record<string, unknown>;
}

test('enforces a specified object interface', async () => {
  const stream = sink();
  const logger = createLogger(
    {
      name: 'my-app',
      base: { userDefinedBase: 'example value' },
    },
    stream,
  );

  logger.info<ExampleMessageContext>(
    {
      activity: 'Testing Logger',
      // @ts-expect-error
      propertyNotAllowed: 'Linting error',
      input: {
        foo: 0xf00,
      },
    },
    'Test log entry',
  );
  const log: any = await once(stream, 'data');

  expect(log.userDefinedBase).toBe('example value');
  expect(log.activity).toBe('Testing Logger');
  expect(log.propertyNotAllowed).toBe('Linting error');
  expect(log.input).toStrictEqual({ foo: 0xf00 });
});

test('should not log timestamp if timestamp logger option is false', async () => {
  const stream = sink();
  const logger = createLogger(
    {
      timestamp: false,
    },
    stream,
  );

  logger.info<ExampleMessageContext>(
    {
      activity: 'Testing Logger',
      input: {
        foo: 0xf00,
      },
    },
    'Test log entry',
  );
  const log: any = await once(stream, 'data');
  expect(log).not.toHaveProperty('timestamp');
});

test('should log customized timestamp if timestamp logger option is supplied', async () => {
  const mockTimestamp = '1672700973914';

  const stream = sink();
  const logger = createLogger(
    {
      timestamp: () => `,"timestamp":"${mockTimestamp}"`,
    },
    stream,
  );

  logger.info<ExampleMessageContext>(
    {
      activity: 'Testing Logger',
      input: {
        foo: 0xf00,
      },
    },
    'Test log entry',
  );
  const log: any = await once(stream, 'data');

  expect(log.timestamp).toBe(mockTimestamp);
});
