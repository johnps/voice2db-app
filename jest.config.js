module.exports = {
  projects: [
    {
      displayName: 'modules',
      testMatch: ['<rootDir>/src/modules/**/*.test.ts'],
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
    },
    {
      displayName: 'components',
      testMatch: ['<rootDir>/src/**/*.test.tsx'],
      preset: 'jest-expo',
      moduleNameMapper: {
        'expo/src/winter/runtime.*': '<rootDir>/__mocks__/expo-winter-runtime.js',
      },
      transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*)',
      ],
    },
  ],
};
