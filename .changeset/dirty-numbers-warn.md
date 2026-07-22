---
'@seek/logger': minor
---

createLogger: Redact request query parameters in HTTP client errors

An HTTP request query string _may_ contain sensitive information. While `@seek/logger` already avoids logging query parameters when it is supplied with a `req` or `res`, HTTP clients may include equivalent information in errors, creating another avenue for information exposure.

`@seek/logger` now automatically redacts the following property path under `err` or `error`:

- `config.params`

If you currently rely on this incidental logging of request query parameters for troubleshooting and you are confident that your request will never contain sensitive information, we recommend writing a separate log that includes the query parameters on a different property path. You can also reach out to discuss your use case.
