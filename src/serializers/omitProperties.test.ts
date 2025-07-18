import { omitProperties } from './omitProperties.js';

const omitPropertyNames = ['omit-prop', 'omit.prop', '', '0'];

const createInput = (): Readonly<Record<string, unknown>> =>
  Object.freeze({
    keepProp: 'Some value',
    ['omit-prop']: 'omit with dash',
    ['omit.prop']: 'omit with dot',
    ['']: 'omit with empty key',
    ['0']: 'omit number as text key',
    omit: { prop: 'DO NOT omit' },
  });

it('omits list of keys from object', () => {
  const input = createInput();

  const result = omitProperties(input, omitPropertyNames);

  expect(result).toStrictEqual({
    keepProp: 'Some value',
    omit: { prop: 'DO NOT omit' },
  });
});

it('does not alter input object', () => {
  const input = createInput();

  const originalInput = structuredClone(input);

  omitProperties(input, omitPropertyNames);

  expect(input).toEqual(originalInput);
});

it.each`
  scenario             | input
  ${'undefined'}       | ${undefined}
  ${'null'}            | ${null}
  ${'an empty object'} | ${{}}
  ${'not an object'}   | ${'key1=value1,key2=value2'}
  ${'an array'}        | ${[{ key1: 'value1' }, { key2: 'value2' }]}
`('returns input when it is $scenario', ({ input }) => {
  const result = omitProperties(input, omitPropertyNames);

  expect(result).toStrictEqual(input);
});
