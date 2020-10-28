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
                    to: 'templates/',
                    flatten: true
                },
                {
                    from: 'src/public/*',
                    to: 'public/',
                    flatten: true,
                    transform: async function(content, absoluteFrom) {
                        if (absoluteFrom.endsWith('.gz')) return await gunzip(content)
                        return content
                    },
                    transformPath: async function(targetPath, absolutePath) {
                        if (absolutePath.endsWith('.gz')) return targetPath.slice(0, -3)
                        return targetPath
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
