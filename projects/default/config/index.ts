import { defineConfig } from '@tarojs/cli';

export default defineConfig({
  projectName: 'default',
  date: '2026-03-18',
  designWidth: 375,
  deviceRatio: { 375: 2, 750: 1 },
  sourceRoot: 'src',
  outputRoot: 'dist',
  plugins: ['@tarojs/plugin-framework-react'],
  h5: {
    publicPath: '/',
    staticDirectory: 'static',
    router: { mode: 'hash', customRoutes: {} },
    devServer: { port: 10086 },
  },
  mini: {},
});
