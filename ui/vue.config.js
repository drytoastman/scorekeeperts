module.exports = {
    chainWebpack: (config) => {
        // mirror the tsconfig.json 'paths' addition
        const common = require('path').resolve(config.get('context'), '../common')
        config.resolve.alias.set('@common', common).end()

        config.module
            .rule('raw')
            .test(/\.txt$/)
            .use('raw-loader')
            .loader('raw-loader')
            .end()
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
    transpileDependencies: [
        'vuetify'
    ],
    devServer: {
        proxy: {
            '/api2': {
                target: 'http://127.0.0.1:4000',
                changeOrigin: true
            },
            '/adminold': {
                target: 'http://127.0.0.1:80',
                changeOrigin: true,
                pathRewrite: {
                    '^/adminold': '/admin'
                }
            }
        }
    }
}
