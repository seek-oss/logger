import type { Transform } from 'stream';

import split from 'split2';

import createLogger from '../index.js';

import { createOmitPropertiesSerializer } from './omitPropertiesSerializer.js';

const omitPropertyNamesBase = ['remove-prop', 'remove.prop'];

it.each`
  scenario                  | omitPropertyNames
  ${'undefined'}            | ${undefined}
  ${'null'}                 | ${null}
  ${'empty'}                | ${[]}
  ${'list without strings'} | ${[undefined, null, 1, true, false, {}, []]}
`(
  'returns empty object when omitPropertyNames is $scenario',
  ({ omitPropertyNames }) => {
    const serializer = createOmitPropertiesSerializer(omitPropertyNames);

    expect(serializer({})).toStrictEqual({});
  },
);

it('returns object with named property containing function', () => {
  const serializer = createOmitPropertiesSerializer(omitPropertyNamesBase);

  expect(serializer).toStrictEqual(expect.any(Function));
});

const sink = () =>
  split((data) => {
    try {
      return JSON.parse(data);
    } catch (err) {
      console.log(err); // eslint-disable-line
      console.log(data); // eslint-disable-line
    }
  });

function once(emitter: Transform, name: string) {
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

it('omits properties from logged object', async () => {
  const serializer = createOmitPropertiesSerializer(omitPropertyNamesBase);

  const input = {
    main: {
      keepProp: 'Some value',
      ['remove-prop']: 'remove with dash',
      ['remove.prop']: 'remove with dot',
      remove: { prop: 'DO NOT REMOVE' },
    },
  };

  const inputString = JSON.stringify(input);
  const stream = sink();
  const logger = createLogger(
    { name: 'my-app', serializers: { ...serializer } },
    stream,
  );
  logger.info(input);

  const log: any = await once(stream, 'data');
  expect(log).toMatchObject({
    main: {
      keepProp: 'Some value',
      remove: { prop: 'DO NOT REMOVE' },
    },
  });
  expect(inputString).toEqual(JSON.stringify(input));
  expect(log).toHaveProperty('timestamp');
});

it.each`
  scenario           | value               | expected
  ${'undefined'}     | ${undefined}        | ${{}}
  ${'null'}          | ${null}             | ${{ main: null }}
  ${'not an object'} | ${123}              | ${{ main: 123 }}
  ${'an array'}      | ${[{ value: 123 }]} | ${{ main: [{ value: 123 }] }}
`(
  'does nothing when top-level property is $scenario',
  async ({ value, expected }) => {
    const serializer = createOmitPropertiesSerializer(['keepProp']);

    const input = {
      main: value,
    };

    const inputString = JSON.stringify(input);
    const stream = sink();
    const logger = createLogger(
      { name: 'my-app', serializers: { ...serializer } },
      stream,
    );
    logger.info(input);

    const log: any = await once(stream, 'data');
    expect(log).toMatchObject(expected);
    expect(inputString).toEqual(JSON.stringify(input));
    expect(log).toHaveProperty('timestamp');
  },
);
