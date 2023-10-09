---
'@seek/logger': minor
---

Omit request headers

`@seek/logger` now omits the following properties from `headers` and `req.headers` by default:

- `x-envoy-attempt-count`
- `x-envoy-decorator-operation`
- `x-envoy-expected-rq-timeout-ms`
- `x-envoy-external-address`
- `x-envoy-internal`
- `x-envoy-peer-metadata`
- `x-envoy-peer-metadata-id`
- `x-envoy-upstream-service-time`

If you would like to opt out of this behaviours, you can provide an empty list or your own list of request headers to `omitHeaderNames`:

```diff
const logger = createLogger({
  name: 'my-app',
+ omitHeaderNames: ['dnt', 'sec-fetch-dest'],
});
```

You can also extend the default list like so:

```diff
- import createLogger from '@seek/logger';
+ import createLogger, { DEFAULT_OMIT_HEADER_NAMES } from '@seek/logger';

const logger = createLogger({
  name: 'my-app',
+ omitHeaderNames: [...DEFAULT_OMIT_HEADER_NAMES, 'dnt', 'sec-fetch-dest']
});
```
