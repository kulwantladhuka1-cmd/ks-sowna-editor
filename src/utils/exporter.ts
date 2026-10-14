import { EditorState, TextLayer, ImageLayer, ShapeLayer, StickerLayer } from '../types/editor';

// Helper image loader
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Helper SVG sticker loader
function loadStickerImage(
  svgPath: string,
  viewBox: string,
  fillColor: string,
  gradientColors?: [string, string],
  useGradient?: boolean
): Promise<HTMLImageElement> {
  const [vbX, vbY, vbW, vbH] = viewBox.split(' ').map(Number);
  const fillDef = useGradient && gradientColors
    ? `<defs><linearGradient id="stkExpGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${gradientColors[0]}"/><stop offset="100%" stop-color="${gradientColors[1]}"/></linearGradient></defs>`
    : '';
  const fillAttr = useGradient && gradientColors ? 'url(#stkExpGrad)' : fillColor;

  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${vbW || 100}" height="${vbH || 100}">
      ${fillDef}
      <path d="${svgPath}" fill="${fillAttr}" />
    </svg>
  `;

  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.src = url;
  });
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export async function exportCanvasToDataURL(
  state: EditorState,
  options: {
    format: 'png' | 'jpeg';
    quality?: number;
    transparent?: boolean;
    scale?: number; // 1 = standard, 2 = 2x HD
  }
): Promise<string> {
  const scale = options.scale || 1;
  const targetW = state.width * scale;
  const targetH = state.height * scale;

  const offscreen = document.createElement('canvas');
  offscreen.width = targetW;
  offscreen.height = targetH;
  const ctx = offscreen.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');

  ctx.scale(scale, scale);

  // 1. Draw Background
  if (options.transparent && options.format === 'png') {
    // Leave transparent
  } else if (state.background.type === 'solid') {
    ctx.fillStyle = state.background.color || '#0a0a0d';
    ctx.fillRect(0, 0, state.width, state.height);
  } else if (state.background.type === 'gradient' || (state.background as any).type === 'radial') {
    let grad: CanvasGradient;
    const colors = state.background.gradient?.colors || ['#231c0e', '#070709'];
    if (state.background.gradient?.type === 'radial' || (state.background as any).type === 'radial') {
      const radius = Math.max(state.width, state.height) * 0.7;
      grad = ctx.createRadialGradient(
        state.width / 2,
        state.height / 2,
        10,
        state.width / 2,
        state.height / 2,
        radius
      );
    } else {
      const angleRad = ((state.background.gradient?.angle || 135) * Math.PI) / 180;
      const x2 = state.width / 2 + (Math.cos(angleRad) * state.width) / 2;
      const y2 = state.height / 2 + (Math.sin(angleRad) * state.height) / 2;
      const x1 = state.width / 2 - (Math.cos(angleRad) * state.width) / 2;
      const y1 = state.height / 2 - (Math.sin(angleRad) * state.height) / 2;
      grad = ctx.createLinearGradient(x1, y1, x2, y2);
    }
    grad.addColorStop(0, colors[0]);
    grad.addColorStop(1, colors[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, state.width, state.height);
  } else if (state.background.type === 'image' && state.background.imageSrc) {
    try {
      const bgImg = await loadImage(state.background.imageSrc);
      ctx.save();
      if (state.background.imageBlur && state.background.imageBlur > 0) {
        ctx.filter = `blur(${state.background.imageBlur}px)`;
      }
      ctx.globalAlpha = state.background.imageOpacity ?? 1;
      const hRatio = state.width / bgImg.width;
      const vRatio = state.height / bgImg.height;
      const ratio = Math.max(hRatio, vRatio);
      const centerShiftX = (state.width - bgImg.width * ratio) / 2;
      const centerShiftY = (state.height - bgImg.height * ratio) / 2;
      ctx.drawImage(
        bgImg,
        0,
        0,
        bgImg.width,
        bgImg.height,
        centerShiftX,
        centerShiftY,
        bgImg.width * ratio,
        bgImg.height * ratio
      );
      ctx.restore();
    } catch (e) {
      ctx.fillStyle = state.background.color || '#0a0a0d';
      ctx.fillRect(0, 0, state.width, state.height);
    }
  } else {
    // Default black background for JPG or non-transparent
    if (!options.transparent || options.format === 'jpeg') {
      ctx.fillStyle = '#0a0a0d';
      ctx.fillRect(0, 0, state.width, state.height);
    }
  }

  // 2. Draw Layers
  for (const layer of state.layers) {
    if (!layer.visible) continue;

    ctx.save();
    ctx.globalAlpha = layer.opacity ?? 1;
    ctx.translate(layer.x, layer.y);
    if (layer.rotation) {
      ctx.rotate((layer.rotation * Math.PI) / 180);
    }

    if (layer.type === 'shape') {
      const {
        shapeType,
        width: w,
        height: h,
        fillType,
        fillColor,
        gradientColors,
        gradientAngle,
        stroke,
        borderRadius,
        shadow,
      } = layer as ShapeLayer;

      if (shadow && shadow.enabled) {
        ctx.shadowColor = shadow.color || 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = shadow.blur || 0;
        ctx.shadowOffsetX = shadow.offsetX || 0;
        ctx.shadowOffsetY = shadow.offsetY || 0;
      }

      let fillStyle: string | CanvasGradient = fillColor || '#D4AF37';
      if (fillType === 'gradient' && gradientColors) {
        const angleRad = ((gradientAngle || 135) * Math.PI) / 180;
        const x1 = -w / 2;
        const y1 = -h / 2;
        const x2 = w / 2;
        const y2 = h / 2;
        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        grad.addColorStop(0, gradientColors[0]);
        grad.addColorStop(1, gradientColors[1]);
        fillStyle = grad;
      }

      ctx.beginPath();
      if (shapeType === 'circle' || shapeType === 'ring') {
        ctx.arc(0, 0, Math.min(w, h) / 2, 0, Math.PI * 2);
      } else if (shapeType === 'roundedRect') {
        drawRoundedRect(ctx, -w / 2, -h / 2, w, h, borderRadius || 16);
      } else {
        ctx.rect(-w / 2, -h / 2, w, h);
      }

      if (fillType !== 'none') {
        ctx.fillStyle = fillStyle;
        ctx.fill();
      }
      if (stroke && stroke.enabled && stroke.width > 0) {
        ctx.strokeStyle = stroke.color || '#D4AF37';
        ctx.lineWidth = stroke.width;
        ctx.stroke();
      }
    } else if (layer.type === 'text') {
      const {
        text,
        fontFamily,
        fontSize,
        fontWeight,
        fontStyle,
        textAlign,
        lineHeight,
        fillType,
        color,
        gradientColors,
        gradientAngle,
        stroke,
        shadow,
        curved,
        highlightBox,
      } = layer as TextLayer;

      ctx.font = `${fontStyle || 'normal'} ${fontWeight || '700'} ${fontSize}px "${fontFamily || 'Anek Gurmukhi'}", sans-serif`;

      if (shadow && shadow.enabled) {
        ctx.shadowColor = shadow.color || 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = shadow.blur || 0;
        ctx.shadowOffsetX = shadow.offsetX || 0;
        ctx.shadowOffsetY = shadow.offsetY || 0;
      }

      if (curved && curved.enabled && curved.radius !== 0) {
        const radius = Math.abs(curved.radius || 240);
        const isConvex = (curved.radius || 240) > 0;
        const chars = Array.from(text);
        const totalWidth = ctx.measureText(text).width;
        const totalAngle = totalWidth / radius;
        let currentAngle = -totalAngle / 2;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.save();
        if (isConvex) {
          ctx.translate(0, radius);
        } else {
          ctx.translate(0, -radius);
        }

        for (let i = 0; i < chars.length; i++) {
          const char = chars[i];
          const charWidth = ctx.measureText(char).width;
          const charAngle = charWidth / radius;
          const angle = currentAngle + charAngle / 2;

          ctx.save();
          ctx.rotate(isConvex ? angle : -angle);
          ctx.translate(0, isConvex ? -radius : radius);
          if (stroke && stroke.enabled && stroke.width > 0) {
            ctx.strokeStyle = stroke.color;
            ctx.lineWidth = stroke.width;
            ctx.strokeText(char, 0, 0);
          }
          ctx.fillStyle = color || '#D4AF37';
          ctx.fillText(char, 0, 0);
          ctx.restore();
          currentAngle += charAngle;
        }
        ctx.restore();
      } else {
        const lines = text.split('\n');
        const effectiveLineHeight = fontSize * (lineHeight || 1.2);
        const totalTextHeight = lines.length * effectiveLineHeight;
        const startY = -totalTextHeight / 2 + fontSize * 0.8;

        let fillStyle: string | CanvasGradient = color || '#FFFFFF';
        if (fillType === 'gradient' && gradientColors) {
          const x1 = -layer.width / 2;
          const y1 = -layer.height / 2;
          const x2 = layer.width / 2;
          const y2 = layer.height / 2;
          const grad = ctx.createLinearGradient(x1, y1, x2, y2);
          grad.addColorStop(0, gradientColors[0]);
          grad.addColorStop(1, gradientColors[1]);
          fillStyle = grad;
        }

        lines.forEach((line, index) => {
          const lineY = startY + index * effectiveLineHeight;
          const metrics = ctx.measureText(line);
          const textLineWidth = metrics.width;
          const lineX = textAlign === 'left' ? -layer.width / 2 : textAlign === 'right' ? layer.width / 2 : 0;

          if (highlightBox && highlightBox.enabled) {
            ctx.save();
            ctx.shadowColor = 'transparent';
            ctx.fillStyle = highlightBox.color || 'rgba(0,0,0,0.7)';
            const pad = highlightBox.padding || 8;
            const rad = highlightBox.radius || 4;
            const boxX = textAlign === 'center' ? -textLineWidth / 2 - pad : textAlign === 'left' ? lineX - pad : lineX - textLineWidth - pad;
            drawRoundedRect(ctx, boxX, lineY - fontSize * 0.85 - pad / 2, textLineWidth + pad * 2, fontSize + pad, rad);
            ctx.fill();
            ctx.restore();
          }

          ctx.textAlign = textAlign || 'center';
          ctx.textBaseline = 'alphabetic';

          // 1. 3D Extrusion
          if (layer.threeD && layer.threeD.enabled && layer.threeD.depth > 0) {
            const depth = layer.threeD.depth;
            const angleRad = ((layer.threeD.angle ?? 45) * Math.PI) / 180;
            const stepX = Math.cos(angleRad);
            const stepY = Math.sin(angleRad);
            ctx.save();
            ctx.shadowColor = 'transparent';
            ctx.fillStyle = layer.threeD.color || '#593802';
            for (let d = depth; d >= 1; d--) {
              ctx.fillText(line, lineX + stepX * d, lineY + stepY * d);
            }
            ctx.restore();
          }

          // 2. Double Outline
          if (layer.doubleStroke && layer.doubleStroke.enabled && layer.doubleStroke.width > 0) {
            ctx.save();
            ctx.strokeStyle = layer.doubleStroke.color || '#D4AF37';
            ctx.lineWidth = (stroke?.enabled ? stroke.width : 0) + layer.doubleStroke.width * 2;
            ctx.lineJoin = 'round';
            ctx.strokeText(line, lineX, lineY);
            ctx.restore();
          }

          // 3. Single Stroke
          if (stroke && stroke.enabled && stroke.width > 0) {
            ctx.save();
            ctx.strokeStyle = stroke.color;
            ctx.lineWidth = stroke.width;
            ctx.lineJoin = 'round';
            ctx.strokeText(line, lineX, lineY);
            ctx.restore();
          }

          // 4. Fill text
          ctx.fillStyle = fillStyle;
          ctx.fillText(line, lineX, lineY);

          // 5. Emboss / Bevel highlight
          if (layer.emboss && layer.emboss.enabled) {
            ctx.save();
            ctx.shadowColor = '#FFFFFF';
            ctx.shadowBlur = 3;
            ctx.shadowOffsetX = -1.5;
            ctx.shadowOffsetY = -1.5;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.fillText(line, lineX, lineY);
            ctx.restore();
          }

          // 6. Underline
          if (layer.underline) {
            ctx.save();
            ctx.strokeStyle = typeof fillStyle === 'string' ? fillStyle : '#D4AF37';
            ctx.lineWidth = Math.max(2, fontSize * 0.06);
            const startLineX = textAlign === 'center' ? -textLineWidth / 2 : textAlign === 'left' ? lineX : lineX - textLineWidth;
            ctx.beginPath();
            ctx.moveTo(startLineX, lineY + fontSize * 0.15);
            ctx.lineTo(startLineX + textLineWidth, lineY + fontSize * 0.15);
            ctx.stroke();
            ctx.restore();
          }

          // 7. Strikethrough
          if (layer.strikethrough) {
            ctx.save();
            ctx.strokeStyle = typeof fillStyle === 'string' ? fillStyle : '#D4AF37';
            ctx.lineWidth = Math.max(2, fontSize * 0.06);
            const startLineX = textAlign === 'center' ? -textLineWidth / 2 : textAlign === 'left' ? lineX : lineX - textLineWidth;
            ctx.beginPath();
            ctx.moveTo(startLineX, lineY - fontSize * 0.3);
            ctx.lineTo(startLineX + textLineWidth, lineY - fontSize * 0.3);
            ctx.stroke();
            ctx.restore();
          }

          // 8. Mirror Reflection
          if (layer.reflection && layer.reflection.enabled && index === lines.length - 1) {
            ctx.save();
            const dist = layer.reflection.distance || 10;
            ctx.translate(0, lineY + dist);
            ctx.scale(1, -0.6);
            ctx.globalAlpha = layer.reflection.opacity || 0.35;
            ctx.fillStyle = fillStyle;
            ctx.fillText(line, lineX, 0);
            ctx.restore();
          }
        });
      }
    } else if (layer.type === 'image') {
      try {
        const imgLayer = layer as ImageLayer;
        const img = await loadImage(imgLayer.src);
        const { width: w, height: h, flipH, flipV, borderRadius, border, shadow, filter } = imgLayer;

        if (shadow && shadow.enabled) {
          ctx.shadowColor = shadow.color || 'rgba(0,0,0,0.5)';
          ctx.shadowBlur = shadow.blur || 0;
          ctx.shadowOffsetX = shadow.offsetX || 0;
          ctx.shadowOffsetY = shadow.offsetY || 0;
        }

        ctx.save();
        ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

        if (filter) {
          const b = filter.brightness ?? 100;
          const c = filter.contrast ?? 100;
          const s = filter.saturation ?? 100;
          const bl = filter.blur ?? 0;
          ctx.filter = `brightness(${b}%) contrast(${c}%) saturate(${s}%) blur(${bl}px)`;
        }

        if (borderRadius && borderRadius > 0) {
          drawRoundedRect(ctx, -w / 2, -h / 2, w, h, borderRadius);
          ctx.clip();
        }

        if (imgLayer.crop) {
          const { x: cx, y: cy, width: cw, height: ch } = imgLayer.crop;
          ctx.drawImage(img, cx, cy, cw, ch, -w / 2, -h / 2, w, h);
        } else {
          ctx.drawImage(img, 0, 0, img.width, img.height, -w / 2, -h / 2, w, h);
        }
        ctx.restore();

        if (border && border.enabled && border.width > 0) {
          ctx.save();
          ctx.strokeStyle = border.color || '#D4AF37';
          ctx.lineWidth = border.width;
          if (borderRadius && borderRadius > 0) {
            drawRoundedRect(ctx, -w / 2, -h / 2, w, h, borderRadius);
          } else {
            ctx.strokeRect(-w / 2, -h / 2, w, h);
          }
          ctx.stroke();
          ctx.restore();
        }
      } catch (e) {
        // Continue
      }
    } else if (layer.type === 'sticker') {
      try {
        const stkLayer = layer as StickerLayer;
        const { width: w, height: h, flipH, flipV, shadow, viewBox, svgPath } = stkLayer;

        if (shadow && shadow.enabled) {
          ctx.shadowColor = shadow.color || 'rgba(0,0,0,0.5)';
          ctx.shadowBlur = shadow.blur || 0;
          ctx.shadowOffsetX = shadow.offsetX || 0;
          ctx.shadowOffsetY = shadow.offsetY || 0;
        }

        const [vbX, vbY, vbW, vbH] = (viewBox || '0 0 100 100').split(' ').map(Number);
        const viewW = vbW || 100;
        const viewH = vbH || 100;

        ctx.save();
        ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
        ctx.translate(-w / 2, -h / 2);
        ctx.scale(w / viewW, h / viewH);
        ctx.translate(-(vbX || 0), -(vbY || 0));

        let fillStyle: string | CanvasGradient = stkLayer.fillColor || '#D4AF37';
        if (stkLayer.useGradient && stkLayer.gradientColors) {
          const grad = ctx.createLinearGradient(0, 0, viewW, viewH);
          grad.addColorStop(0, stkLayer.gradientColors[0]);
          grad.addColorStop(1, stkLayer.gradientColors[1]);
          fillStyle = grad;
        }

        const path = new Path2D(svgPath);
        ctx.fillStyle = fillStyle;
        ctx.fill(path);
        ctx.restore();
      } catch (e) {
        // Continue
      }
    }

    ctx.restore();
  }

  const mimeType = options.format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const quality = options.quality ?? 0.95;
  return offscreen.toDataURL(mimeType, quality);
}

export function downloadImage(dataUrl: string, filename: string) {
  try {
    const parts = dataUrl.split(',');
    const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const blob = new Blob([u8arr], { type: mime });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    }, 2000);
  } catch (err) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
    }, 500);
  }
}
