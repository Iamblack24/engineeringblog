module.exports = {
  plugins: [
    require('tailwindcss'),
    require('autoprefixer'),
    process.env.NODE_ENV === 'production'
      ? require('@fullhuman/postcss-purgecss')({
          content: [
            './src/**/*.{js,jsx,ts,tsx}',
            './public/index.html'
          ],
          defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
          safelist: {
            standard: [/^html/, /^body/],
            deep: [/markdown/, /solution/, /pdf/]
          }
        })
      : null
  ].filter(Boolean)
};