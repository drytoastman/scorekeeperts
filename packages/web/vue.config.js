/* eslint-disable @typescript-eslint/no-var-requires */
module.exports = {
    chainWebpack: config => {
        // const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
        // config.plugin('analyze').use(BundleAnalyzerPlugin)
    },
    pages: {
        admin: {
            entry: './src/Admin/main.ts',
            template: 'public/index.html',
            title: 'Scorekeeper Admin'
        },
        docs: {
            entry: './src/Docs/main.ts',
            template: 'public/index.html',
            title: 'Scorekeeper Docs'
        },
        register: {
            entry: './src/Registration/main.ts',
            template: 'public/index.html',
            title: 'Scorekeeper Registration'
        },
        results: {
            entry: './src/Results/main.ts',
            template: 'public/index.html',
            title: 'Scorekeeper Results'
        }
    },
    css: {
        extract: process.env.NODE_ENV === 'production' ? { ignoreOrder: true } : false
    },
    transpileDependencies: [
        'vuetify',
        'sctypes'
    ],
    productionSourceMap: false,
    devServer: {
        port: 80,
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
