---
'@seek/logger': major
---

Add default redact paths

`@seek/logger` now redacts a set of [built-in paths](https://github.com/seek-oss/logger/blob/add-default-header-redacts/src/redact/index.ts) by default.

These default paths cannot be disabled, and are concatenated to custom redact paths provided via `redact: ['custom.path']` or `redact: { paths: ['custom.path'] }`.
