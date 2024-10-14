const skuba = require('eslint-config-skuba');

module.exports = [
  {
    ignores: ['**/flow-typed'],
  },
  ...skuba,
];
