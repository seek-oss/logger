const skuba = require('skuba/config/eslint');

module.exports = [
  {
    ignores: ['**/flow-typed'],
  },
  ...skuba,
];
