/* eslint-disable @typescript-eslint/no-var-requires */
module.exports = {
    chainWebpack: (config) => {
        // mirror the tsconfig.json 'paths' addition
        const common = require('path').resolve(config.get('context'), '../common')
        config.resolve.alias.set('@common', common).end()
        /*
        config.plugin('friendly-errors').tap(args => [Object.assign(args[0], {
            onErrors: (severity, errors) => {
                errors.splice(0, errors.length, ...errors.filter(error => !error.message.match(/export '.*' was not found in/)))
            }
        })]) */

        // const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
        // config.plugin('analyze').use(BundleAnalyzerPlugin)
    },
    pages: {
        register: {
            entry: './src/Registration/main.ts',
            template: 'public/index.html',
            title: 'Scorekeeper Registration'
        },
        admin: {
            entry: './src/Admin/main.ts',
            template: 'public/index.html',
            title: 'Scorekeeper Admin'
        }
    },
    css: {
        extract: process.env.NODE_ENV === 'production' ? { ignoreOrder: true } : false
    },
    transpileDependencies: [
        'vuetify'
    ],
    productionSourceMap: false,
    devServer: {
        proxy: {
            '/api2': {
                target: 'http://127.0.0.1:4000',
                changeOrigin: true,
                headers: {
                    RegisterBase: '/register'
                }
            },
            '/public': {
                target: 'http://127.0.0.1:4000',
                changeOrigin: true
            }
        }
    }
}
