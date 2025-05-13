module.exports = function (api) {
  api.cache(true); //  캐싱 활성화 (빌드 성능 향상)
  return {
    presets: ['babel-preset-expo'], //  Expo 프리셋 사용
    plugins: [
      //  추가 플러그인 (필요한 경우)
      '@babel/plugin-proposal-optional-chaining', // 옵셔널 체이닝 지원
      '@babel/plugin-proposal-nullish-coalescing-operator', // 널 병합 연산자 지원
      'react-native-reanimated/plugin', // Reanimated 2 플러그인
    ],
  };
};