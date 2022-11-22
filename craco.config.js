const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const WebpackBar = require('webpackbar');
const CracoAntDesignPlugin = require('craco-antd');
const path = require('path');

module.exports = {
    webpack: {
        alias: {
            '@components': path.resolve(__dirname, 'src/components/'),
            '@utils': path.resolve(__dirname, 'src/utils'),
            '@assets': path.resolve(__dirname, 'src/assets'),
            '@pages': path.resolve(__dirname, 'src/pages'),
            '@requests': path.resolve(__dirname, 'src/requests'),
            '@wallet-adapters': path.resolve(__dirname, 'src/wallet-adapters'),
            '@themes': path.resolve(__dirname, 'src/themes'),
        },
        configure: {
            module: {
                rules: [
                    {
                        test: /\.mjs$/,
                        include: /node_modules/,
                        type: 'javascript/auto',
                    },
                ],
            },
            resolve: {
                fallback: {
                    stream: require.resolve('stream-browserify'),
                    crypto: require.resolve('crypto-browserify'),
                    buffer: require.resolve('buffer'),
                    path: false,
                    os: false,
                    fs: false,
                },
            },
        },
        plugins: [
            new WebpackBar({ profile: true }),
            ...(process.env.NODE_ENV === 'development' ? [new BundleAnalyzerPlugin({ openAnalyzer: false })] : []),
        ],
    },
    plugins: [
        {
            plugin: CracoAntDesignPlugin,
        },
    ],
    babel: {
        presets: ['@emotion/babel-preset-css-prop'],
    },
};
