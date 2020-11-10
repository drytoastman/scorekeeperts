/* eslint-disable @typescript-eslint/no-var-requires */
module.exports = {
    chainWebpack: config => {
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
        },
        live: {
            entry: './src/Live/main.ts',
            template: 'public/index.html',
            title: 'Scorekeeper Live'
        },
        docs: {
            entry: './src/Docs/main.ts',
            template: 'public/index.html',
            title: 'Scorekeeper Docs'
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
