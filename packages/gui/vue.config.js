// eslint-disable-next-line @typescript-eslint/no-var-requires
const webpack = require('webpack')

module.exports = {
    chainWebpack: config => {
        // const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
        // config.plugin('analyze').use(BundleAnalyzerPlugin)
        config.plugin('ignore').use(webpack.IgnorePlugin, [{ resourceRegExp: /^(pg-native)$/ }])
        config.target = 'node14.15'
    },
    pluginOptions: {
        electronBuilder: {
            externals: ['serialport'],
            preload: 'src/preload.ts',
            nodeModulesPath: ['../../node_modules', './node_modules'],
            chainWebpackMainProcess: (config) => {
                // have to set separately for main packaging
                config.plugin('ignore').use(webpack.IgnorePlugin, [{ resourceRegExp: /^(pg-native)$/ }])
            }
        }
    },
    pages: {
        sync: {
            entry: './src/Monitor/main.ts',
            template: 'public/index.html',
            title: 'Scorekeeper Status'
        },
        sync2: {
            entry: './src/Monitor/main.ts',
            template: 'public/index.html',
            title: 'Scorekeeper Status 2'
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
