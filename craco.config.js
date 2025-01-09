// craco.config.js
const path = require('path');

module.exports = {
    webpack: {
      configure: {
        resolve: {
          fallback: {
            fs: false,
            http: require.resolve('stream-http'),
            https: require.resolve('https-browserify'),
            url: require.resolve('url/'),
            zlib: require.resolve('browserify-zlib'),
            stream: require.resolve('stream-browserify'),
            util: require.resolve('util/'),
            buffer: require.resolve('buffer/'),
            assert: require.resolve('assert/'),
          },
        },
        module: {
          rules: [
            {
              test: /\.html$/,
              use: [
                {
                  loader: 'html-loader',
                  options: {
                    minimize: true,
                    esModule: false,
                  }
                }
              ]
            }
          ]
        },
        ignoreWarnings: [
          function ignoreSourceMapsLoaderWarnings(warning) {
            if (warning.module && typeof warning.module === 'object' && warning.module.resource) {
              return (
                warning.module.resource.includes('html2pdf.js') ||
                warning.module.resource.includes('@mediapipe/tasks-vision')
              );
            }
            return false;
          }
        ],
      }
    },
    style: {
      postcss: {
        plugins: [
          require('tailwindcss'),
          require('autoprefixer'),
        ]
      }
    },
    devServer: {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
        'Content-Security-Policy': `
          default-src 'self';
          script-src 'self' 'unsafe-inline' 'unsafe-eval';
          style-src 'self' 'unsafe-inline';
          img-src 'self' data: https:;
          connect-src 'self' http://localhost:5000 https://generativelanguage.googleapis.com;
          font-src 'self' data:;
          object-src 'none';
          media-src 'self';
          frame-src 'self';
        `
      },
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false
        }
      }
    }
  };