const path = require('path')
const webpack = require('webpack')
const CopyPlugin = require('copy-webpack-plugin')
const util = require('util')
const zlib = require('zlib')
const gunzip = util.promisify(zlib.gunzip)

const {
    NODE_ENV = 'production'
} = process.env

module.exports = {
    entry: './src/index.ts',
    mode: NODE_ENV,
    target: 'node',
    plugins: [
        new webpack.IgnorePlugin(/^pg-native$/),
        new webpack.DefinePlugin({ 'global.GENTLY': false }),
        new webpack.ContextReplacementPlugin(/nunjucks|express|any-promise/),
        new CopyPlugin({
            patterns: [
                {
                    from: 'src/templates/*',
                    to: 'templates/'
                },
                {
                    from: 'src/public/*',
                    to: 'public/',
                    transform: async function(content, absoluteFrom) {
                        if (absoluteFrom.endsWith('.gz')) return await gunzip(content)
                        return content
                    }
                }
            ]
        })
    ],
    externals: /^(fsevents|request|fast-crc32c|original-fs)$/,
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: 'index.js'
    },
    resolve: {
        extensions: ['.ts', '.js'],
        alias: {
            '@': path.resolve(__dirname, 'src'),
            '@common': path.resolve(__dirname, 'src/common')
        }
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: ['ts-loader']
            }
        ]
    }
}
