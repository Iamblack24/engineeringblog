// craco.config.js
const path = require('path');

module.exports = {
    webpack: {
      configure: {
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
          {
            module: /html2pdf\.js/,
          },
          {
            module: /@mediapipe\/tasks-vision/,
          },
          function ignoreSourceMapsLoaderWarnings(warning) {
            return (
              warning.module &&
              (warning.module.includes('html2pdf.js') ||
                warning.module.includes('@mediapipe/tasks-vision')) &&
              warning.details &&
              warning.details.includes('source-map-loader')
            );
          },
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