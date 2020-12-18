const path = require('path')
const webpack = require('webpack')

module.exports = {
  chainWebpack: config => {
    // const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
    // config.plugin('analyze').use(BundleAnalyzerPlugin)
    //target: 'node14.15',
  },
  configureWebpack: {
    plugins: [
      new webpack.IgnorePlugin({ resourceRegExp: /^(pg-native|dns)$/ }),
    ]
  },
  /*
  "pages": {
    "sync": {
      "entry": "./src/Sync/main.ts",
      "template": "public/index.html",
      "title": "Sync Status"
    }
  },
  */
  "css": {
    "extract": process.env.NODE_ENV === 'production' ? { ignoreOrder: true } : false
  },
  "transpileDependencies": [
    "vuetify"
  ],
  "productionSourceMap": false
}