---
'@seek/logger': major
---

Omit a default set or the specified headers from the logged object

By default, the following headers in the `headers` and `req.headers`
properties will be omitted from the logged object:

- 'x-envoy-attempt-count'
- 'x-envoy-decorator-operation'
- 'x-envoy-expected-rq-timeout-ms'
- 'x-envoy-external-address'
- 'x-envoy-internal'
- 'x-envoy-peer-metadata'
- 'x-envoy-peer-metadata-id'
- 'x-envoy-upstream-service-time'

If you would like to opt out of this, you can provide an empty list or your
own list of headers to omit in the `omitHeaderNames` property when creating
your logger e.g.

```typescript
const logger = createLogger({
  name: 'my-app',
  omitHeaderNames: ['dnt', 'sec-fetch-dest'],
});
```
