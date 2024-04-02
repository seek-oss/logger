---
'@seek/logger': major
---

fix: Merging default redact paths with custom redact options

Default redact paths were added.

Tests revealed that creating the logger with a custom redact options object
instead of an array of strings would override the default redact paths.

This change concatenates the default redact paths and the custom `redact.paths`.
