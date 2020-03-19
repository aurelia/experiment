module.exports = {
  extends: [
    '../../.eslintrc.js',
  ],
  env: {
    node: true,
  },
  rules: {
    'import/no-nodejs-modules': 'off', // nodejs modules are core to the node runtime
  }
};
