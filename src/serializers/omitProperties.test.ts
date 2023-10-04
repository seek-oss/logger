import { omitProperties } from './omitProperties';

const omitPropertyNames = ['omit-prop', 'omit.prop', '', '0'];

const objBase: Readonly<Record<string, unknown>> = {
  keepProp: 'Some value',
  ['omit-prop']: 'omit with dash',
  ['omit.prop']: 'omit with dot',
  ['']: 'omit with empty key',
  ['0']: 'omit number as text key',
  omit: { prop: 'DO NOT omit' },
};

it('omits list of keys from object', () => {
  const result = omitProperties({ ...objBase }, omitPropertyNames);

  expect(result).toStrictEqual({
    keepProp: 'Some value',
    omit: { prop: 'DO NOT omit' },
  });
});

it.each`
  scenario        | keyName
  ${'undefined'}  | ${undefined}
  ${'null'}       | ${null}
  ${'non-string'} | ${99}
`('ignores $scenario key name', ({ keyName }) => {
  const result = omitProperties(
    {
      ['99']: 'Keep key with number as text when same number provided as key',
      ...objBase,
    },
    [...omitPropertyNames, keyName],
  );

  expect(result).toStrictEqual({
    ['99']: 'Keep key with number as text when same number provided as key',
    keepProp: 'Some value',
    omit: { prop: 'DO NOT omit' },
  });
});

it('does not alter input object', () => {
  const obj = { ...objBase };
  omitProperties({ ...objBase }, omitPropertyNames);

  expect(obj).toStrictEqual(objBase);
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
