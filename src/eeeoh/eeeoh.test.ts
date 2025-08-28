import { formatOutput } from './eeeoh.js';

// These scenarios are currently unreachable, but we want `formatOutput` to be
// forward compatible with future changes to the eeeoh integration that may make
// Datadog routing configuration optional.
describe('formatOutput', () => {
  test('Splunk config with Datadog unspecified', () =>
    expect(formatOutput({ index: 'my_index_prod' }, null, undefined))
      .toMatchInlineSnapshot(`
      {
        "ddsource": "nodejs",
        "eeeoh": {
          "logs": {
            "splunk": {
              "index": "my_index_prod",
            },
          },
        },
      }
    `));

  test('Splunk config with Datadog disabled', () =>
    expect(formatOutput({ index: 'my_index_prod' }, false, undefined))
      .toMatchInlineSnapshot(`
      {
        "eeeoh": {
          "logs": {
            "datadog": {
              "enabled": false,
            },
            "splunk": {
              "index": "my_index_prod",
            },
          },
        },
      }
    `));
});
