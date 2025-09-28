---
'@seek/logger': minor
---

createLogger: Redact request body in HTTP client errors

An HTTP request body _may_ contain sensitive information. While `@seek/logger` currently avoids logging body content when it is supplied with a `req` or `res`, HTTP clients may include equivalent information in errors, creating another avenue for information exposure.

`@seek/logger` now automatically redacts the following property paths under `err` or `error`:

- `config.body`
- `config.data`
- `config.headers.user-email`
- `response.config`

If you currently rely on this incidental logging of request bodies for troubleshooting and you are confident that your request will never contain sensitive information, we recommend writing a separate log that includes the request body on a different property path. You can also reach out to discuss your use case.
