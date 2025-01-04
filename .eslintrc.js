module.exports = {
    extends: ['react-app'],
    rules: {
      'no-unused-vars': 'warn',
      'source-map-loader/no-missing-source-maps': 'off'
    },
    ignorePatterns: [
      'node_modules/**/*',
      'build/**/*',
      '**/*.map'
    ],
    settings: {
      'import/resolver': {
        node: {
          paths: ['src']
        }
      }
    }
  };