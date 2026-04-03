module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            [
                'module-resolver',
                {
                    root: ['./'],
                    alias: {
                        '@': './src',
                        '@components': './src/components',
                        '@screens': './src/screens',
                        '@services': './src/services',
                        '@utils': './src/utils',
                        '@store': './src/store',
                        '@types': './src/types',
                        '@constants': './src/constants'
                    }
                }
            ],
            'react-native-reanimated/plugin'
        ]
    };
};
