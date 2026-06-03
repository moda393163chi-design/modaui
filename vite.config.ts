import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ command, mode }) => {
  // 开发环境和生产环境的不同配置
  const isDev = command === 'serve';

  return {
    plugins: [
      react({
        // 优化 React 编译
        fastRefresh: isDev,
      }),
      tailwindcss(),
    ],
    
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
      // Firebase 特殊处理：防止重复打包
      dedupe: ['firebase', 'firebase-admin'],
    },

    // 开发服务器配置
    server: {
      // HMR 配置修复保护
      hmr: process.env.DISABLE_HMR === 'true'
        ? false
        : (isDev
          ? {
              host: 'localhost',
              port: 5173,
              protocol: 'ws',
            }
          : false),
      
      // 文件监听配置
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      
      // 禁用文件预转换（加快启动）
      preTransformRequests: false,
    },

    // 构建优化
    build: {
      target: 'ES2022',
      minify: true,
      sourcemap: true,
      
      // 代码分割策略
      rollupOptions: {
        output: {
          // 确保 Firebase 在单独的代码块中
          manualChunks: (id) => {
            // Firebase 单独打包
            if (id.includes('firebase')) {
              return 'firebase-vendor';
            }
            // Node modules 的 vendor 包
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          },
        },
      },

      // 增加块大小限制（因为 Firebase 很大）
      chunkSizeWarningLimit: 1000,
    },

    // 优化依赖
    optimizeDeps: {
      // 预绑定 Firebase 以提高初始加载速度
      include: [
        'firebase/app',
        'firebase/auth',
        'firebase/firestore',
      ],
      // 排除 server-only 包
      exclude: ['fsevents'],
    },

    // 定义全局变量
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    },
  };
});
