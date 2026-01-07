/** @type {import('next').NextConfig} */
const nextConfig = {
  // PDF.jsがNode.js環境用のcanvasを読み込もうとするのを防ぐ設定
  webpack: (config, { isServer }) => {
    // Node.js用のcanvasを無効化
    config.resolve.alias.canvas = false;
    
    // ブラウザ側でのみpdfjs-distのworkerを読み込めるように設定
    if (!isServer) {
      // pdfjs-dist 3.x系では worker.js が正しいパス
      try {
        config.resolve.alias['pdfjs-dist/build/pdf.worker.js'] = require.resolve('pdfjs-dist/build/pdf.worker.js');
      } catch (e) {
        // worker.jsが見つからない場合はlegacy版を試す
        try {
          config.resolve.alias['pdfjs-dist/build/pdf.worker.js'] = require.resolve('pdfjs-dist/legacy/build/pdf.worker.js');
        } catch (e2) {
          // エラーを無視（コンポーネント側で動的インポートを使用）
        }
      }
    }
    
    return config;
  },
  // Turbopack設定（空の設定でエラーを回避）
  turbopack: {},
};

module.exports = nextConfig;