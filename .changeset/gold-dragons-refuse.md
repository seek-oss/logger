---
'@seek/logger': minor
---

feat: Add configurable string length and function handling options

- Add `stringLength` option to control maximum loggable string length (default: 512)
- Add `functions` option to control whether functions are included in log objects (default: true)
- deps: dtrim ^1.13.0
