// 画像の最適化（圧縮、リサイズ）
// sharpがインストールされていない場合は元のバッファを返す
export async function optimizeImage(
  imageBuffer: Buffer,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: "jpeg" | "png" | "webp";
  } = {}
): Promise<Buffer> {
  // sharpが利用可能かチェック
  let sharp: any;
  try {
    sharp = require("sharp");
  } catch (error) {
    console.warn("sharp is not installed, skipping image optimization");
    return imageBuffer;
  }

  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 85,
    format = "jpeg",
  } = options;

  try {
    let pipeline = sharp(imageBuffer);

    // メタデータを取得
    const metadata = await pipeline.metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    // リサイズが必要な場合
    if (width > maxWidth || height > maxHeight) {
      pipeline = pipeline.resize(maxWidth, maxHeight, {
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    // フォーマット変換と圧縮
    if (format === "jpeg") {
      pipeline = pipeline.jpeg({ quality, mozjpeg: true });
    } else if (format === "png") {
      pipeline = pipeline.png({ quality, compressionLevel: 9 });
    } else if (format === "webp") {
      pipeline = pipeline.webp({ quality });
    }

    return await pipeline.toBuffer();
  } catch (error) {
    console.error("Image optimization failed:", error);
    // エラー時は元のバッファを返す
    return imageBuffer;
  }
}

// Base64画像を最適化
export async function optimizeBase64Image(
  base64Image: string,
  options?: Parameters<typeof optimizeImage>[1]
): Promise<string> {
  try {
    // Base64をバッファに変換
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");

    // 最適化
    const optimizedBuffer = await optimizeImage(imageBuffer, options);

    // Base64に戻す
    const format = options?.format || "jpeg";
    const mimeType = format === "png" ? "image/png" : format === "webp" ? "image/webp" : "image/jpeg";
    const optimizedBase64 = `data:${mimeType};base64,${optimizedBuffer.toString("base64")}`;

    return optimizedBase64;
  } catch (error) {
    console.error("Base64 image optimization failed:", error);
    return base64Image;
  }
}


export async function optimizeImage(
  imageBuffer: Buffer,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: "jpeg" | "png" | "webp";
  } = {}
): Promise<Buffer> {
  // sharpが利用可能かチェック
  let sharp: any;
  try {
    sharp = require("sharp");
  } catch (error) {
    console.warn("sharp is not installed, skipping image optimization");
    return imageBuffer;
  }

  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 85,
    format = "jpeg",
  } = options;

  try {
    let pipeline = sharp(imageBuffer);

    // メタデータを取得
    const metadata = await pipeline.metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    // リサイズが必要な場合
    if (width > maxWidth || height > maxHeight) {
      pipeline = pipeline.resize(maxWidth, maxHeight, {
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    // フォーマット変換と圧縮
    if (format === "jpeg") {
      pipeline = pipeline.jpeg({ quality, mozjpeg: true });
    } else if (format === "png") {
      pipeline = pipeline.png({ quality, compressionLevel: 9 });
    } else if (format === "webp") {
      pipeline = pipeline.webp({ quality });
    }

    return await pipeline.toBuffer();
  } catch (error) {
    console.error("Image optimization failed:", error);
    // エラー時は元のバッファを返す
    return imageBuffer;
  }
}

// Base64画像を最適化
export async function optimizeBase64Image(
  base64Image: string,
  options?: Parameters<typeof optimizeImage>[1]
): Promise<string> {
  try {
    // Base64をバッファに変換
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");

    // 最適化
    const optimizedBuffer = await optimizeImage(imageBuffer, options);

    // Base64に戻す
    const format = options?.format || "jpeg";
    const mimeType = format === "png" ? "image/png" : format === "webp" ? "image/webp" : "image/jpeg";
    const optimizedBase64 = `data:${mimeType};base64,${optimizedBuffer.toString("base64")}`;

    return optimizedBase64;
  } catch (error) {
    console.error("Base64 image optimization failed:", error);
    return base64Image;
  }
}

