/**
 * Downscale an uploaded image so it fits comfortably in localStorage.
 *
 * Background images are only ever drawn into an SNS card whose largest edge is
 * 1920px, so anything bigger is wasted bytes that risk blowing the storage
 * quota. We shrink the long edge to `maxEdge` and re-encode as JPEG, which
 * shrinks typical photo data URLs by an order of magnitude.
 *
 * Requires a DOM (uses canvas); call from the browser only.
 */
export function downscaleImage(file: File, maxEdge = 1920): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
      img.onload = () => {
        const { width, height } = img;
        const scale = Math.min(1, maxEdge / Math.max(width, height));
        const w = Math.max(1, Math.round(width * scale));
        const h = Math.max(1, Math.round(height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("canvas context を取得できませんでした"));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}


export interface ProcessedSignatureImage {
  dataUrl: string;
  aspectRatio: number;
}

/**
 * Downscale a signature while preserving transparency. Signatures are usually
 * sparse line art, so PNG remains compact and avoids a white JPEG background.
 */
export function downscaleSignatureImage(
  file: File,
  maxEdge = 800,
): Promise<ProcessedSignatureImage> {
  if (!["image/png", "image/webp"].includes(file.type)) {
    return Promise.reject(new Error("署名画像は PNG または WebP を選択してください"));
  }
  if (file.size > 5 * 1024 * 1024) {
    return Promise.reject(new Error("署名画像は 5MB 以下にしてください"));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("署名画像の読み込みに失敗しました"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("署名画像の読み込みに失敗しました"));
      image.onload = () => {
        const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("canvas context を取得できませんでした"));
          return;
        }
        context.drawImage(image, 0, 0, width, height);
        resolve({
          dataUrl: canvas.toDataURL("image/png"),
          aspectRatio: width / height,
        });
      };
      image.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
