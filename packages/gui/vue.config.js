// eslint-disable-next-line @typescript-eslint/no-var-requires
const webpack = require('webpack')

module.exports = {
    chainWebpack: config => {
        // const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
        // config.plugin('analyze').use(BundleAnalyzerPlugin)
        //target: 'node14.15',
        config.plugin('ignore').use(webpack.IgnorePlugin, [{ resourceRegExp: /^(pg-native|dns)$/ }])
    },
    pluginOptions: {
        electronBuilder: {
            preload: 'src/preload.ts',
            nodeModulesPath: ['../../node_modules', './node_modules'],
            chainWebpackMainProcess: (config) => {
                config.plugin('ignore').use(webpack.IgnorePlugin, [{ resourceRegExp: /^(pg-native)$/ }])
            }
        }
    },
    css: {
        extract: process.env.NODE_ENV === 'production' ? { ignoreOrder: true } : false
    },
    transpileDependencies: [
      'vuetify'
    ],
    productionSourceMap: false
}
