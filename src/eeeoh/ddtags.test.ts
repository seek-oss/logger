import { ddTags } from './ddTags.js';

test('ddtags', () =>
  expect(
    ddTags({
      env: 'test',
      one: 'two:three',
      'a:b': 'c',
      version: 'try-to-break-with,comma:colon',
      '': '',
      ' ': '?',
      '?': ' ',
    }),
  ).toMatchInlineSnapshot(
    `"env:test,one:two:three,a:b:c,version:try-to-break-with_comma:colon"`,
  ));
