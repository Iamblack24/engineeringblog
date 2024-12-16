// craco.config.js
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
                    sources: {
                      list: [
                        {
                          tag: 'script',
                          attribute: 'src',
                          type: 'src',
                        },
                      ],
                    },
                  },
                },
              ],
            },
          ],
        },
      },
    },
  };