// ============================================================================
// Canvas Blur Utilities
// Provides cross-browser blur support with native filter + StackBlur fallback
// ============================================================================

// Feature detection: actually test if ctx.filter blur works during drawImage
// Safari accepts the property but doesn't apply it, so we need a real test
export const supportsNativeBlur = (() => {
  if (typeof document === 'undefined') return false;

  try {
    // Create a small test canvas
    const testCanvas = document.createElement('canvas');
    testCanvas.width = 10;
    testCanvas.height = 10;
    const testCtx = testCanvas.getContext('2d');
    if (!testCtx) return false;

    // Check if filter property is accepted
    testCtx.filter = 'blur(2px)';
    if (testCtx.filter !== 'blur(2px)') return false;

    // Draw a single white pixel in the center
    const srcCanvas = document.createElement('canvas');
    srcCanvas.width = 10;
    srcCanvas.height = 10;
    const srcCtx = srcCanvas.getContext('2d');
    if (!srcCtx) return false;
    srcCtx.fillStyle = 'white';
    srcCtx.fillRect(5, 5, 1, 1);

    // Draw with blur filter
    testCtx.filter = 'blur(2px)';
    testCtx.drawImage(srcCanvas, 0, 0);

    // Check if blur actually spread the pixel (check a nearby pixel)
    const pixel = testCtx.getImageData(4, 5, 1, 1).data;
    // If blur worked, the adjacent pixel should have some color from the spread
    return pixel[3] > 0; // Check alpha channel has some value
  } catch {
    return false;
  }
})();

/**
 * Apply blur to a canvas context (modifies pixels in place)
 * Only use this for Safari fallback - for native filter, use ctx.filter before drawing
 */
export function blurCanvasInPlace(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  radius: number,
): void {
  if (radius < 1) return;
  stackBlurCanvas(ctx, width, height, Math.min(radius, 254));
}

// ============================================================================
// StackBlur Algorithm
// Fast approximation of Gaussian blur that works on canvas ImageData
// Based on http://www.quasimondo.com/StackBlurForCanvas/StackBlurDemo.html
// ============================================================================

const MUL_TABLE = [
  512, 512, 456, 512, 328, 456, 335, 512, 405, 328, 271, 456, 388, 335, 292, 512, 454, 405, 364,
  328, 298, 271, 496, 456, 420, 388, 360, 335, 312, 292, 273, 512, 482, 454, 428, 405, 383, 364,
  345, 328, 312, 298, 284, 271, 259, 496, 475, 456, 437, 420, 404, 388, 374, 360, 347, 335, 323,
  312, 302, 292, 282, 273, 265, 512, 497, 482, 468, 454, 441, 428, 417, 405, 394, 383, 373, 364,
  354, 345, 337, 328, 320, 312, 305, 298, 291, 284, 278, 271, 265, 259, 507, 496, 485, 475, 465,
  456, 446, 437, 428, 420, 412, 404, 396, 388, 381, 374, 367, 360, 354, 347, 341, 335, 329, 323,
  318, 312, 307, 302, 297, 292, 287, 282, 278, 273, 269, 265, 261, 512, 505, 497, 489, 482, 475,
  468, 461, 454, 447, 441, 435, 428, 422, 417, 411, 405, 399, 394, 389, 383, 378, 373, 368, 364,
  359, 354, 350, 345, 341, 337, 332, 328, 324, 320, 316, 312, 309, 305, 301, 298, 294, 291, 287,
  284, 281, 278, 274, 271, 268, 265, 262, 259, 257, 507, 501, 496, 491, 485, 480, 475, 470, 465,
  460, 456, 451, 446, 442, 437, 433, 428, 424, 420, 416, 412, 408, 404, 400, 396, 392, 388, 385,
  381, 377, 374, 370, 367, 363, 360, 357, 354, 350, 347, 344, 341, 338, 335, 332, 329, 326, 323,
  320, 318, 315, 312, 310, 307, 304, 302, 299, 297, 294, 292, 289, 287, 285, 282, 280, 278, 275,
  273, 271, 269, 267, 265, 263, 261, 259,
];

const SHG_TABLE = [
  9, 11, 12, 13, 13, 14, 14, 15, 15, 15, 15, 16, 16, 16, 16, 17, 17, 17, 17, 17, 17, 17, 18, 18, 18,
  18, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 20, 20, 20, 20,
  20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21,
  21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 22, 22, 22, 22, 22, 22, 22,
  22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22,
  22, 22, 22, 22, 22, 22, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
  23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
  23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
  24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
  24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
  24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
];

function stackBlurCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  radius: number,
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  const wm = width - 1;
  const hm = height - 1;
  const div = radius + radius + 1;
  const mulSum = MUL_TABLE[radius];
  const shgSum = SHG_TABLE[radius];
  const stack = new Int32Array(div * 4);

  let stackStart: number;
  let stackEnd: number;
  let stackIdx: number;
  let rSum: number;
  let gSum: number;
  let bSum: number;
  let aSum: number;
  let rOutSum: number;
  let gOutSum: number;
  let bOutSum: number;
  let aOutSum: number;
  let rInSum: number;
  let gInSum: number;
  let bInSum: number;
  let aInSum: number;
  let pr: number;
  let pg: number;
  let pb: number;
  let pa: number;
  let yi = 0;
  let yw = 0;

  // Horizontal pass
  for (let y = 0; y < height; y++) {
    rSum = gSum = bSum = aSum = 0;
    rOutSum = gOutSum = bOutSum = aOutSum = 0;
    rInSum = gInSum = bInSum = aInSum = 0;

    pr = pixels[yi];
    pg = pixels[yi + 1];
    pb = pixels[yi + 2];
    pa = pixels[yi + 3];

    for (let i = 0; i <= radius; i++) {
      stackIdx = i * 4;
      stack[stackIdx] = pr;
      stack[stackIdx + 1] = pg;
      stack[stackIdx + 2] = pb;
      stack[stackIdx + 3] = pa;

      const rbs = radius + 1 - i;
      rSum += pr * rbs;
      gSum += pg * rbs;
      bSum += pb * rbs;
      aSum += pa * rbs;
      rOutSum += pr;
      gOutSum += pg;
      bOutSum += pb;
      aOutSum += pa;
    }

    for (let i = 1; i <= radius; i++) {
      const p = yi + ((i > wm ? wm : i) << 2);
      pr = pixels[p];
      pg = pixels[p + 1];
      pb = pixels[p + 2];
      pa = pixels[p + 3];

      stackIdx = (radius + i) * 4;
      stack[stackIdx] = pr;
      stack[stackIdx + 1] = pg;
      stack[stackIdx + 2] = pb;
      stack[stackIdx + 3] = pa;

      rSum += pr * (radius + 1 - i);
      gSum += pg * (radius + 1 - i);
      bSum += pb * (radius + 1 - i);
      aSum += pa * (radius + 1 - i);
      rInSum += pr;
      gInSum += pg;
      bInSum += pb;
      aInSum += pa;
    }

    stackStart = radius;
    for (let x = 0; x < width; x++) {
      pixels[yi] = (rSum * mulSum) >>> shgSum;
      pixels[yi + 1] = (gSum * mulSum) >>> shgSum;
      pixels[yi + 2] = (bSum * mulSum) >>> shgSum;
      pixels[yi + 3] = (aSum * mulSum) >>> shgSum;

      rSum -= rOutSum;
      gSum -= gOutSum;
      bSum -= bOutSum;
      aSum -= aOutSum;

      stackEnd = (stackStart + div - radius) % div;
      stackIdx = stackEnd * 4;
      rOutSum -= stack[stackIdx];
      gOutSum -= stack[stackIdx + 1];
      bOutSum -= stack[stackIdx + 2];
      aOutSum -= stack[stackIdx + 3];

      const p = x + radius + 1;
      const pIdx = yw + (p > wm ? wm : p) * 4;
      pr = pixels[pIdx];
      pg = pixels[pIdx + 1];
      pb = pixels[pIdx + 2];
      pa = pixels[pIdx + 3];

      stack[stackIdx] = pr;
      stack[stackIdx + 1] = pg;
      stack[stackIdx + 2] = pb;
      stack[stackIdx + 3] = pa;

      rInSum += pr;
      gInSum += pg;
      bInSum += pb;
      aInSum += pa;

      rSum += rInSum;
      gSum += gInSum;
      bSum += bInSum;
      aSum += aInSum;

      stackStart = (stackStart + 1) % div;
      stackIdx = stackStart * 4;
      rOutSum += stack[stackIdx];
      gOutSum += stack[stackIdx + 1];
      bOutSum += stack[stackIdx + 2];
      aOutSum += stack[stackIdx + 3];

      rInSum -= stack[stackIdx];
      gInSum -= stack[stackIdx + 1];
      bInSum -= stack[stackIdx + 2];
      aInSum -= stack[stackIdx + 3];

      yi += 4;
    }
    yw += width * 4;
  }

  // Vertical pass
  for (let x = 0; x < width; x++) {
    yi = x * 4;
    rSum = gSum = bSum = aSum = 0;
    rOutSum = gOutSum = bOutSum = aOutSum = 0;
    rInSum = gInSum = bInSum = aInSum = 0;

    pr = pixels[yi];
    pg = pixels[yi + 1];
    pb = pixels[yi + 2];
    pa = pixels[yi + 3];

    for (let i = 0; i <= radius; i++) {
      stackIdx = i * 4;
      stack[stackIdx] = pr;
      stack[stackIdx + 1] = pg;
      stack[stackIdx + 2] = pb;
      stack[stackIdx + 3] = pa;

      const rbs = radius + 1 - i;
      rSum += pr * rbs;
      gSum += pg * rbs;
      bSum += pb * rbs;
      aSum += pa * rbs;
      rOutSum += pr;
      gOutSum += pg;
      bOutSum += pb;
      aOutSum += pa;
    }

    for (let i = 1; i <= radius; i++) {
      const p = yi + (i > hm ? hm : i) * width * 4;
      pr = pixels[p];
      pg = pixels[p + 1];
      pb = pixels[p + 2];
      pa = pixels[p + 3];

      stackIdx = (radius + i) * 4;
      stack[stackIdx] = pr;
      stack[stackIdx + 1] = pg;
      stack[stackIdx + 2] = pb;
      stack[stackIdx + 3] = pa;

      rSum += pr * (radius + 1 - i);
      gSum += pg * (radius + 1 - i);
      bSum += pb * (radius + 1 - i);
      aSum += pa * (radius + 1 - i);
      rInSum += pr;
      gInSum += pg;
      bInSum += pb;
      aInSum += pa;
    }

    stackStart = radius;
    for (let y = 0; y < height; y++) {
      const pIdx = x * 4 + y * width * 4;
      pixels[pIdx] = (rSum * mulSum) >>> shgSum;
      pixels[pIdx + 1] = (gSum * mulSum) >>> shgSum;
      pixels[pIdx + 2] = (bSum * mulSum) >>> shgSum;
      pixels[pIdx + 3] = (aSum * mulSum) >>> shgSum;

      rSum -= rOutSum;
      gSum -= gOutSum;
      bSum -= bOutSum;
      aSum -= aOutSum;

      stackEnd = (stackStart + div - radius) % div;
      stackIdx = stackEnd * 4;
      rOutSum -= stack[stackIdx];
      gOutSum -= stack[stackIdx + 1];
      bOutSum -= stack[stackIdx + 2];
      aOutSum -= stack[stackIdx + 3];

      const p = y + radius + 1;
      const pSrc = x * 4 + (p > hm ? hm : p) * width * 4;
      pr = pixels[pSrc];
      pg = pixels[pSrc + 1];
      pb = pixels[pSrc + 2];
      pa = pixels[pSrc + 3];

      stack[stackIdx] = pr;
      stack[stackIdx + 1] = pg;
      stack[stackIdx + 2] = pb;
      stack[stackIdx + 3] = pa;

      rInSum += pr;
      gInSum += pg;
      bInSum += pb;
      aInSum += pa;

      rSum += rInSum;
      gSum += gInSum;
      bSum += bInSum;
      aSum += aInSum;

      stackStart = (stackStart + 1) % div;
      stackIdx = stackStart * 4;
      rOutSum += stack[stackIdx];
      gOutSum += stack[stackIdx + 1];
      bOutSum += stack[stackIdx + 2];
      aOutSum += stack[stackIdx + 3];

      rInSum -= stack[stackIdx];
      gInSum -= stack[stackIdx + 1];
      bInSum -= stack[stackIdx + 2];
      aInSum -= stack[stackIdx + 3];
    }
  }

  ctx.putImageData(imageData, 0, 0);
}
