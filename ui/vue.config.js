module.exports = {
    chainWebpack: (config) => {
        // mirror the tsconfig.json 'paths' addition
        const common = require('path').resolve(config.get('context'), '../common')
        config.resolve.alias.set('@common', common).end()
    },
    pages: {
        register: {
            entry: './src/Registration/main.ts',
            template: 'public/index.html',
            title: 'Registration',
            scripts: [
                'https://www.paypalobjects.com/api/checkout.js',
                'https://js.squareupsandbox.com/v2/paymentform'
            ],
            chunks: ['chunk-vendors', 'chunk-common', 'register']
        },
        admin: {
            entry: './src/Admin/main.ts',
            template: 'public/index.html',
            title: 'Admin',
            scripts: [],
            chunks: ['chunk-vendors', 'chunk-common', 'admin']
        }
    },
    transpileDependencies: [
        'vuetify',
        'vuex-module-decorators'
    ],
    devServer: {
        headers: {
        },
        proxy: {
            '/api2': {
                target: 'http://127.0.0.1:4000',
                changeOrigin: true
            }
        }
    }
}
