module.exports = {
    chainWebpack: (config) => {
        // mirror the tsconfig.json 'paths' addition
        const common = require('path').resolve(config.get('context'), '../common')
        config.resolve.alias.set('@common', common).end()

        /*
        // condense is stripping &nbsp;
        config.module.rule('vue').use('vue-loader').loader('vue-loader').tap(options => {
            options.compilerOptions.whitespace = 'preserve'
            return options
        })
        */
    },
    pages: {
        register: {
            entry: './src/Registration/main.ts',
            template: 'public/index.html',
            title: 'Registration',
            chunks: ['chunk-vendors', 'chunk-common', 'register']
        },
        admin: {
            entry: './src/Admin/main.ts',
            template: 'public/index.html',
            title: 'Admin',
            chunks: ['chunk-vendors', 'chunk-common', 'admin']
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
            }
        }
    }
}
