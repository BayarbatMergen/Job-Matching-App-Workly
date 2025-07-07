module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      '@babel/plugin-transform-optional-chaining',           // ✅ 변경
      '@babel/plugin-transform-nullish-coalescing-operator', // ✅ 변경
      'react-native-reanimated/plugin'
    ],
  };
};
