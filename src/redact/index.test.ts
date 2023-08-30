import { keyFromPath } from '.';

it.each`
  paths                                          | path
  ${['data', 'top', 'prop1']}                    | ${'data.top.prop1'}
  ${['data', 'top.prop1']}                       | ${'data["top.prop1"]'}
  ${['headers', 'x-request-id']}                 | ${'headers["x-request-id"]'}
  ${['_start', '$with', 'allowed', 'Char']}      | ${'_start.$with.allowed.Char'}
  ${['-start', '.with', '4notAllowed', '~Char']} | ${'["-start"][".with"]["4notAllowed"]["~Char"]'}
  ${['con-tain', 'not!', 'allow∑∂', 'Chår']}     | ${'["con-tain"]["not!"]["allow∑∂"]["Chår"]'}
`(`should convert '$paths' to '$path'`, ({ paths, path }) => {
  const result = keyFromPath(paths);

  expect(result).toBe(path);
});
