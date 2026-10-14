import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Layer,
  TextLayer,
  ImageLayer,
  ShapeLayer,
  StickerLayer,
  CanvasBackground,
} from '../types/editor';

interface CanvasRendererProps {
  width: number;
  height: number;
  background: CanvasBackground;
  layers: Layer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onUpdateLayer: (id: string, updates: Partial<Layer>) => void;
  zoom: number;
  panOffset: { x: number; y: number };
  onPanChange: (offset: { x: number; y: number }) => void;
}

// Image cache to avoid re-instantiating HTMLImageElement on every render frame
const imageCache: Record<string, HTMLImageElement> = {};

function getImage(src: string): Promise<HTMLImageElement> {
  if (imageCache[src] && imageCache[src].complete) {
    return Promise.resolve(imageCache[src]);
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache[src] = img;
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  });
}

// Helper for rendering SVG Path stickers to an offscreen canvas image
const stickerCache: Record<string, HTMLImageElement> = {};
function getStickerImage(
  svgPath: string,
  viewBox: string,
  fillColor: string,
  gradientColors?: [string, string],
  useGradient?: boolean
): Promise<HTMLImageElement> {
  const cacheKey = `${svgPath}_${fillColor}_${useGradient}_${gradientColors?.join(',')}`;
  if (stickerCache[cacheKey]) {
    return Promise.resolve(stickerCache[cacheKey]);
  }

  const [vbX, vbY, vbW, vbH] = viewBox.split(' ').map(Number);
  const fillDef = useGradient && gradientColors
    ? `<defs><linearGradient id="stkGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${gradientColors[0]}"/><stop offset="100%" stop-color="${gradientColors[1]}"/></linearGradient></defs>`
    : '';
  const fillAttr = useGradient && gradientColors ? 'url(#stkGrad)' : fillColor;

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
      stickerCache[cacheKey] = img;
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

export const CanvasRenderer: React.FC<CanvasRendererProps> = ({
  width,
  height,
  background,
  layers,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
  zoom,
  panOffset,
  onPanChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Interaction states
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [activeHandle, setActiveHandle] = useState<string | null>(null);

  const dragStartRef = useRef<{
    pointerX: number;
    pointerY: number;
    layerX: number;
    layerY: number;
    layerW: number;
    layerH: number;
    layerRotation: number;
  }>({
    pointerX: 0,
    pointerY: 0,
    layerX: 0,
    layerY: 0,
    layerW: 0,
    layerH: 0,
    layerRotation: 0,
  });

  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Convert client viewport coordinates to Canvas local coordinates
  const clientToCanvasCoord = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * width;
      const y = ((clientY - rect.top) / rect.height) * height;
      return { x, y };
    },
    [width, height]
  );

  // Render canvas frame
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset transform & clear
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // 1. Draw Background
    if (background.type === 'transparent') {
      // Intentionally transparent
    } else if (background.type === 'solid') {
      ctx.fillStyle = background.color || '#ffffff';
      ctx.fillRect(0, 0, width, height);
    } else if (background.type === 'gradient' || (background as any).type === 'radial') {
      let grad: CanvasGradient;
      const colors = background.gradient?.colors || ['#231c0e', '#070709'];
      if (background.gradient?.type === 'radial' || (background as any).type === 'radial') {
        const radius = Math.max(width, height) * 0.7;
        grad = ctx.createRadialGradient(
          width / 2,
          height / 2,
          10,
          width / 2,
          height / 2,
          radius
        );
      } else {
        const angleRad = ((background.gradient?.angle || 135) * Math.PI) / 180;
        const x2 = width / 2 + (Math.cos(angleRad) * width) / 2;
        const y2 = height / 2 + (Math.sin(angleRad) * height) / 2;
        const x1 = width / 2 - (Math.cos(angleRad) * width) / 2;
        const y1 = height / 2 - (Math.sin(angleRad) * height) / 2;
        grad = ctx.createLinearGradient(x1, y1, x2, y2);
      }
      grad.addColorStop(0, colors[0]);
      grad.addColorStop(1, colors[1]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    } else if (background.type === 'image' && background.imageSrc) {
      const bgImg = imageCache[background.imageSrc];
      if (bgImg && bgImg.complete) {
        ctx.save();
        if (background.imageBlur && background.imageBlur > 0) {
          ctx.filter = `blur(${background.imageBlur}px)`;
        }
        ctx.globalAlpha = background.imageOpacity ?? 1;
        const hRatio = width / bgImg.width;
        const vRatio = height / bgImg.height;
        const ratio = Math.max(hRatio, vRatio);
        const centerShiftX = (width - bgImg.width * ratio) / 2;
        const centerShiftY = (height - bgImg.height * ratio) / 2;
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
      } else {
        getImage(background.imageSrc).then(() => renderCanvas()).catch(() => {});
        ctx.fillStyle = background.color || '#0a0a0d';
        ctx.fillRect(0, 0, width, height);
      }
    } else {
      ctx.fillStyle = background.color || '#0a0a0d';
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Render Layers in ascending order (bottom to top)
    for (const layer of layers) {
      if (!layer.visible) continue;

      ctx.save();
      ctx.globalAlpha = layer.opacity ?? 1;

      // Position & Rotation around layer center
      ctx.translate(layer.x, layer.y);
      if (layer.rotation) {
        ctx.rotate((layer.rotation * Math.PI) / 180);
      }

      // Draw specific layer type
      if (layer.type === 'shape') {
        drawShapeLayer(ctx, layer);
      } else if (layer.type === 'text') {
        drawTextLayer(ctx, layer);
      } else if (layer.type === 'image') {
        drawImageLayer(ctx, layer);
      } else if (layer.type === 'sticker') {
        drawStickerLayer(ctx, layer);
      }

      ctx.restore();
    }

    // 3. Draw Selection Box and Handles on top
    const selectedLayer = layers.find((l) => l.id === selectedLayerId);
    if (selectedLayer && selectedLayer.visible) {
      drawSelectionBox(ctx, selectedLayer);
    }
  }, [width, height, background, layers, selectedLayerId]);

  // Trigger render when dependencies change
  useEffect(() => {
    let animationFrameId: number;
    const render = () => {
      renderCanvas();
    };
    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [renderCanvas]);

  // DRAW FUNCTIONS FOR EACH LAYER TYPE
  const drawTextLayer = (ctx: CanvasRenderingContext2D, layer: TextLayer) => {
    const {
      text,
      fontFamily,
      fontSize,
      fontWeight,
      fontStyle,
      textAlign,
      letterSpacing,
      lineHeight,
      fillType,
      color,
      gradientColors,
      gradientAngle,
      stroke,
      shadow,
      curved,
      highlightBox,
    } = layer;

    ctx.font = `${fontStyle || 'normal'} ${fontWeight || '700'} ${fontSize}px "${fontFamily || 'Anek Gurmukhi'}", sans-serif`;

    // Drop shadow
    if (shadow && shadow.enabled) {
      ctx.shadowColor = shadow.color || 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = shadow.blur || 0;
      ctx.shadowOffsetX = shadow.offsetX || 0;
      ctx.shadowOffsetY = shadow.offsetY || 0;
    } else {
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    }

    // Curved Text Mode
    if (curved && curved.enabled && curved.radius !== 0) {
      drawCurvedText(ctx, layer);
      return;
    }

    // Standard Multi-line Text
    const lines = text.split('\n');
    const effectiveLineHeight = fontSize * (lineHeight || 1.2);
    const totalTextHeight = lines.length * effectiveLineHeight;
    const startY = -totalTextHeight / 2 + fontSize * 0.8;

    // Fill style (solid or linear gradient)
    let fillStyle: string | CanvasGradient = color || '#FFFFFF';
    if (fillType === 'gradient' && gradientColors) {
      const angleRad = ((gradientAngle || 90) * Math.PI) / 180;
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

      let lineX = 0;
      if (textAlign === 'left') {
        lineX = -layer.width / 2;
      } else if (textAlign === 'right') {
        lineX = layer.width / 2;
      } else {
        lineX = 0;
      }

      // Highlight Box background
      if (highlightBox && highlightBox.enabled) {
        ctx.save();
        ctx.shadowColor = 'transparent';
        ctx.fillStyle = highlightBox.color || 'rgba(0,0,0,0.7)';
        const pad = highlightBox.padding || 8;
        const rad = highlightBox.radius || 4;
        const boxX =
          textAlign === 'center'
            ? -textLineWidth / 2 - pad
            : textAlign === 'left'
            ? lineX - pad
            : lineX - textLineWidth - pad;
        const boxY = lineY - fontSize * 0.85 - pad / 2;
        drawRoundedRect(
          ctx,
          boxX,
          boxY,
          textLineWidth + pad * 2,
          fontSize + pad,
          rad
        );
        ctx.fill();
        ctx.restore();
      }

      ctx.textAlign = textAlign || 'center';
      ctx.textBaseline = 'alphabetic';

      // 1. 3D Extrusion (PixelLab 3D text)
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

      // 2. Double Outline (PixelLab Double Stroke)
      if (layer.doubleStroke && layer.doubleStroke.enabled && layer.doubleStroke.width > 0) {
        ctx.save();
        ctx.strokeStyle = layer.doubleStroke.color || '#D4AF37';
        ctx.lineWidth = (stroke?.enabled ? stroke.width : 0) + layer.doubleStroke.width * 2;
        ctx.lineJoin = 'round';
        ctx.strokeText(line, lineX, lineY);
        ctx.restore();
      }

      // 3. Single Outline / Stroke
      if (stroke && stroke.enabled && stroke.width > 0) {
        ctx.save();
        ctx.strokeStyle = stroke.color || '#000000';
        ctx.lineWidth = stroke.width;
        ctx.lineJoin = 'round';
        ctx.strokeText(line, lineX, lineY);
        ctx.restore();
      }

      // 4. Main Text Fill (Preserving exact Gurmukhi string)
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
  };

  // Draw Curved / Circular Arc Text
  const drawCurvedText = (ctx: CanvasRenderingContext2D, layer: TextLayer) => {
    const {
      text,
      fillType,
      color,
      gradientColors,
      stroke,
      curved,
    } = layer;
    const radius = Math.abs(curved?.radius || 240);
    const isConvex = (curved?.radius || 240) > 0;

    const chars = Array.from(text);
    if (chars.length === 0) return;

    // Total width of string
    const totalWidth = ctx.measureText(text).width;
    const totalAngle = totalWidth / radius;
    let currentAngle = -totalAngle / 2;

    let fillStyle: string | CanvasGradient = color || '#D4AF37';
    if (fillType === 'gradient' && gradientColors) {
      const grad = ctx.createLinearGradient(
        -layer.width / 2,
        0,
        layer.width / 2,
        0
      );
      grad.addColorStop(0, gradientColors[0]);
      grad.addColorStop(1, gradientColors[1]);
      fillStyle = grad;
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.save();
    // Offset circle center so that apex of curve is at (0, 0)
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
        ctx.lineJoin = 'round';
        ctx.strokeText(char, 0, 0);
      }

      ctx.fillStyle = fillStyle;
      ctx.fillText(char, 0, 0);
      ctx.restore();

      currentAngle += charAngle;
    }
    ctx.restore();
  };

  const drawShapeLayer = (ctx: CanvasRenderingContext2D, layer: ShapeLayer) => {
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
    } = layer;

    if (shadow && shadow.enabled) {
      ctx.shadowColor = shadow.color || 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = shadow.blur || 0;
      ctx.shadowOffsetX = shadow.offsetX || 0;
      ctx.shadowOffsetY = shadow.offsetY || 0;
    }

    // Determine Fill
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

    switch (shapeType) {
      case 'circle': {
        const r = Math.min(w, h) / 2;
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        break;
      }
      case 'ring': {
        const r = Math.min(w, h) / 2;
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        break;
      }
      case 'rectangle': {
        ctx.rect(-w / 2, -h / 2, w, h);
        break;
      }
      case 'roundedRect': {
        drawRoundedRect(ctx, -w / 2, -h / 2, w, h, borderRadius || 16);
        break;
      }
      case 'star': {
        drawStarPath(ctx, 0, 0, 5, w / 2, (w / 2) * 0.45);
        break;
      }
      case 'shield': {
        drawShieldPath(ctx, -w / 2, -h / 2, w, h);
        break;
      }
      case 'diamond': {
        ctx.moveTo(0, -h / 2);
        ctx.lineTo(w / 2, 0);
        ctx.lineTo(0, h / 2);
        ctx.lineTo(-w / 2, 0);
        ctx.closePath();
        break;
      }
      case 'triangle': {
        ctx.moveTo(0, -h / 2);
        ctx.lineTo(w / 2, h / 2);
        ctx.lineTo(-w / 2, h / 2);
        ctx.closePath();
        break;
      }
      case 'heart': {
        drawHeartPath(ctx, -w / 2, -h / 2, w, h);
        break;
      }
      case 'badge': {
        drawBadgePath(ctx, 0, 0, w / 2, 12, 0.85);
        break;
      }
      case 'crown': {
        drawCrownPath(ctx, -w / 2, -h / 2, w, h);
        break;
      }
      case 'line': {
        ctx.moveTo(-w / 2, 0);
        ctx.lineTo(w / 2, 0);
        break;
      }
      default:
        ctx.rect(-w / 2, -h / 2, w, h);
    }

    if (fillType !== 'none') {
      ctx.fillStyle = fillStyle;
      ctx.fill();
    }

    if (stroke && stroke.enabled && stroke.width > 0) {
      ctx.strokeStyle = stroke.color || '#D4AF37';
      ctx.lineWidth = stroke.width;
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
  };

  const drawImageLayer = (
    ctx: CanvasRenderingContext2D,
    layer: ImageLayer
  ) => {
    try {
      const img = imageCache[layer.src];
      if (!img || !img.complete) {
        getImage(layer.src).then(() => renderCanvas()).catch(() => {});
        // Draw frame placeholder while loading
        ctx.strokeStyle = 'rgba(212,175,55,0.4)';
        ctx.strokeRect(-layer.width / 2, -layer.height / 2, layer.width, layer.height);
        return;
      }

      const { width: w, height: h, flipH, flipV, borderRadius, border, shadow, filter } =
        layer;

      if (shadow && shadow.enabled) {
        ctx.shadowColor = shadow.color || 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = shadow.blur || 0;
        ctx.shadowOffsetX = shadow.offsetX || 0;
        ctx.shadowOffsetY = shadow.offsetY || 0;
      }

      ctx.save();
      // Flip transform
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

      // Filters
      if (filter) {
        const b = filter.brightness ?? 100;
        const c = filter.contrast ?? 100;
        const s = filter.saturation ?? 100;
        const bl = filter.blur ?? 0;
        const sepia = filter.sepia ?? 0;
        const gray = filter.grayscale ?? 0;
        ctx.filter = `brightness(${b}%) contrast(${c}%) saturate(${s}%) blur(${bl}px) sepia(${sepia}%) grayscale(${gray}%)`;
      }

      // Rounded corners clipping
      if (borderRadius && borderRadius > 0) {
        ctx.beginPath();
        drawRoundedRect(ctx, -w / 2, -h / 2, w, h, borderRadius);
        ctx.clip();
      }

      // Draw cropped or full image
      if (layer.crop) {
        const { x: cx, y: cy, width: cw, height: ch } = layer.crop;
        ctx.drawImage(img, cx, cy, cw, ch, -w / 2, -h / 2, w, h);
      } else {
        ctx.drawImage(img, 0, 0, img.width, img.height, -w / 2, -h / 2, w, h);
      }

      // Warmth filter overlay
      if (filter && filter.warmth && filter.warmth !== 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = filter.warmth > 0
          ? `rgba(255, 140, 0, ${Math.abs(filter.warmth) / 100})`
          : `rgba(0, 180, 255, ${Math.abs(filter.warmth) / 100})`;
        ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.restore();
      }

      // Vignette effect overlay
      if (filter && filter.vignette && filter.vignette > 0) {
        ctx.save();
        const vigGrad = ctx.createRadialGradient(0, 0, Math.min(w, h) * 0.2, 0, 0, Math.max(w, h) * 0.7);
        vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
        vigGrad.addColorStop(1, `rgba(0,0,0,${filter.vignette / 100})`);
        ctx.fillStyle = vigGrad;
        ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.restore();
      }

      ctx.restore();

      // Border outline
      if (border && border.enabled && border.width > 0) {
        ctx.save();
        ctx.strokeStyle = border.color || '#D4AF37';
        ctx.lineWidth = border.width;
        ctx.beginPath();
        if (borderRadius && borderRadius > 0) {
          drawRoundedRect(ctx, -w / 2, -h / 2, w, h, borderRadius);
        } else {
          ctx.rect(-w / 2, -h / 2, w, h);
        }
        ctx.stroke();
        ctx.restore();
      }
    } catch (e) {
      ctx.strokeStyle = '#D4AF37';
      ctx.strokeRect(-layer.width / 2, -layer.height / 2, layer.width, layer.height);
    }
  };

  const drawStickerLayer = (
    ctx: CanvasRenderingContext2D,
    layer: StickerLayer
  ) => {
    try {
      const { width: w, height: h, flipH, flipV, shadow, viewBox, svgPath } = layer;

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

      let fillStyle: string | CanvasGradient = layer.fillColor || '#D4AF37';
      if (layer.useGradient && layer.gradientColors) {
        const grad = ctx.createLinearGradient(0, 0, viewW, viewH);
        grad.addColorStop(0, layer.gradientColors[0]);
        grad.addColorStop(1, layer.gradientColors[1]);
        fillStyle = grad;
      }

      const path = new Path2D(svgPath);
      ctx.fillStyle = fillStyle;
      ctx.fill(path);
      ctx.restore();
    } catch (e) {
      // Ignore
    }
  };

  // Helper geometry paths
  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) => {
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
  };

  const drawStarPath = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    spikes: number,
    outerRadius: number,
    innerRadius: number
  ) => {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
  };

  const drawShieldPath = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ) => {
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w, y + h * 0.2);
    ctx.quadraticCurveTo(x + w, y + h * 0.7, x + w / 2, y + h);
    ctx.quadraticCurveTo(x, y + h * 0.7, x, y + h * 0.2);
    ctx.lineTo(x + w / 2, y);
    ctx.closePath();
  };

  const drawCrownPath = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ) => {
    ctx.moveTo(x, y + h);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + w, y + h * 0.4);
    ctx.lineTo(x + w * 0.75, y + h * 0.7);
    ctx.lineTo(x + w * 0.5, y);
    ctx.lineTo(x + w * 0.25, y + h * 0.7);
    ctx.lineTo(x, y + h * 0.4);
    ctx.closePath();
  };

  const drawHeartPath = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ) => {
    const topCurveHeight = h * 0.3;
    ctx.moveTo(x + w / 2, y + topCurveHeight);
    ctx.bezierCurveTo(
      x + w / 2,
      y,
      x,
      y,
      x,
      y + topCurveHeight
    );
    ctx.bezierCurveTo(
      x,
      y + (h + topCurveHeight) / 2,
      x + w / 2,
      y + (h + topCurveHeight) / 1.5,
      x + w / 2,
      y + h
    );
    ctx.bezierCurveTo(
      x + w / 2,
      y + (h + topCurveHeight) / 1.5,
      x + w,
      y + (h + topCurveHeight) / 2,
      x + w,
      y + topCurveHeight
    );
    ctx.bezierCurveTo(
      x + w,
      y,
      x + w / 2,
      y,
      x + w / 2,
      y + topCurveHeight
    );
    ctx.closePath();
  };

  const drawBadgePath = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    points: number,
    innerRatio: number
  ) => {
    const step = Math.PI / points;
    let rot = -Math.PI / 2;
    ctx.moveTo(cx, cy - radius);
    for (let i = 0; i < points; i++) {
      ctx.lineTo(cx + Math.cos(rot) * radius, cy + Math.sin(rot) * radius);
      rot += step;
      ctx.lineTo(
        cx + Math.cos(rot) * radius * innerRatio,
        cy + Math.sin(rot) * radius * innerRatio
      );
      rot += step;
    }
    ctx.closePath();
  };

  // DRAW SELECTION OUTLINE AND HANDLES
  const drawSelectionBox = (
    ctx: CanvasRenderingContext2D,
    layer: Layer
  ) => {
    ctx.save();
    ctx.translate(layer.x, layer.y);
    if (layer.rotation) {
      ctx.rotate((layer.rotation * Math.PI) / 180);
    }

    const pad = 10;
    const w = layer.width + pad * 2;
    const h = layer.height + pad * 2;
    const x = -w / 2;
    const y = -h / 2;

    // Glowing Golden Selection Box
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);

    // Rotation stem & handle (top)
    const rotDist = 34;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(0, y - rotDist);
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Rotation knob
    ctx.beginPath();
    ctx.arc(0, y - rotDist, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#FFF6CA';
    ctx.fill();
    ctx.strokeStyle = '#AA820A';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 4 Corner Handles
    const handleRadius = 7;
    const corners = [
      { x: x, y: y }, // NW
      { x: x + w, y: y }, // NE
      { x: x + w, y: y + h }, // SE
      { x: x, y: y + h }, // SW
    ];

    corners.forEach((c) => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, handleRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    });

    ctx.restore();
  };

  // TOUCH & POINTER INTERACTIONS
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const coords = clientToCanvasCoord(e.clientX, e.clientY);

    // If active selected layer exists, check if user tapped a handle or inside bounding box
    const selectedLayer = layers.find((l) => l.id === selectedLayerId);
    if (selectedLayer && !selectedLayer.locked) {
      // Calculate local coordinates relative to selected layer center
      const dx = coords.x - selectedLayer.x;
      const dy = coords.y - selectedLayer.y;
      const angleRad = ((-selectedLayer.rotation || 0) * Math.PI) / 180;
      const localX = dx * Math.cos(angleRad) - dy * Math.sin(angleRad);
      const localY = dx * Math.sin(angleRad) + dy * Math.cos(angleRad);

      const pad = 10;
      const halfW = selectedLayer.width / 2 + pad;
      const halfH = selectedLayer.height / 2 + pad;
      const handleHitDist = 24;

      // 1. Rotation handle check
      const rotHandleDist = Math.hypot(localX, localY - (-halfH - 34));
      if (rotHandleDist <= handleHitDist) {
        setIsRotating(true);
        setActiveHandle('rotate');
        dragStartRef.current = {
          pointerX: coords.x,
          pointerY: coords.y,
          layerX: selectedLayer.x,
          layerY: selectedLayer.y,
          layerW: selectedLayer.width,
          layerH: selectedLayer.height,
          layerRotation: selectedLayer.rotation || 0,
        };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        return;
      }

      // 2. Corner resize handles
      const cornerHandles = [
        { id: 'se', x: halfW, y: halfH },
        { id: 'sw', x: -halfW, y: halfH },
        { id: 'ne', x: halfW, y: -halfH },
        { id: 'nw', x: -halfW, y: -halfH },
      ];

      for (const h of cornerHandles) {
        if (Math.hypot(localX - h.x, localY - h.y) <= handleHitDist) {
          setIsResizing(true);
          setActiveHandle(h.id);
          dragStartRef.current = {
            pointerX: coords.x,
            pointerY: coords.y,
            layerX: selectedLayer.x,
            layerY: selectedLayer.y,
            layerW: selectedLayer.width,
            layerH: selectedLayer.height,
            layerRotation: selectedLayer.rotation || 0,
          };
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          return;
        }
      }

      // 3. Inside bounding box drag
      if (Math.abs(localX) <= halfW && Math.abs(localY) <= halfH) {
        setIsDragging(true);
        dragStartRef.current = {
          pointerX: coords.x,
          pointerY: coords.y,
          layerX: selectedLayer.x,
          layerY: selectedLayer.y,
          layerW: selectedLayer.width,
          layerH: selectedLayer.height,
          layerRotation: selectedLayer.rotation || 0,
        };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        return;
      }
    }

    // Check hit test on other layers from top to bottom
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      if (!layer.visible || layer.locked) continue;

      const dx = coords.x - layer.x;
      const dy = coords.y - layer.y;
      const angleRad = ((-layer.rotation || 0) * Math.PI) / 180;
      const localX = dx * Math.cos(angleRad) - dy * Math.sin(angleRad);
      const localY = dx * Math.sin(angleRad) + dy * Math.cos(angleRad);

      const halfW = layer.width / 2 + 10;
      const halfH = layer.height / 2 + 10;

      if (Math.abs(localX) <= halfW && Math.abs(localY) <= halfH) {
        onSelectLayer(layer.id);
        setIsDragging(true);
        dragStartRef.current = {
          pointerX: coords.x,
          pointerY: coords.y,
          layerX: layer.x,
          layerY: layer.y,
          layerW: layer.width,
          layerH: layer.height,
          layerRotation: layer.rotation || 0,
        };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        return;
      }
    }

    // Tapped empty space: deselect or pan
    onSelectLayer(null);
    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX - panOffset.x,
      y: e.clientY - panOffset.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      onPanChange({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
      return;
    }

    const selectedLayer = layers.find((l) => l.id === selectedLayerId);
    if (!selectedLayer || selectedLayer.locked) return;

    const coords = clientToCanvasCoord(e.clientX, e.clientY);

    if (isDragging) {
      const deltaX = coords.x - dragStartRef.current.pointerX;
      const deltaY = coords.y - dragStartRef.current.pointerY;
      onUpdateLayer(selectedLayer.id, {
        x: Math.round(dragStartRef.current.layerX + deltaX),
        y: Math.round(dragStartRef.current.layerY + deltaY),
      });
    } else if (isResizing && activeHandle) {
      const deltaX = coords.x - dragStartRef.current.pointerX;
      const deltaY = coords.y - dragStartRef.current.pointerY;

      // Project onto layer angle
      const angleRad = ((-selectedLayer.rotation || 0) * Math.PI) / 180;
      const projX = deltaX * Math.cos(angleRad) - deltaY * Math.sin(angleRad);
      const projY = deltaX * Math.sin(angleRad) + deltaY * Math.cos(angleRad);

      let newW = dragStartRef.current.layerW;
      let newH = dragStartRef.current.layerH;

      if (activeHandle === 'se') {
        newW += projX * 2;
        newH += projY * 2;
      } else if (activeHandle === 'sw') {
        newW -= projX * 2;
        newH += projY * 2;
      } else if (activeHandle === 'ne') {
        newW += projX * 2;
        newH -= projY * 2;
      } else if (activeHandle === 'nw') {
        newW -= projX * 2;
        newH -= projY * 2;
      }

      newW = Math.max(30, Math.min(newW, 4000));
      newH = Math.max(30, Math.min(newH, 4000));

      onUpdateLayer(selectedLayer.id, {
        width: Math.round(newW),
        height: Math.round(newH),
      });
    } else if (isRotating) {
      const angle =
        (Math.atan2(coords.y - selectedLayer.y, coords.x - selectedLayer.x) *
          180) /
        Math.PI;
      // top rotation knob is at -90 deg
      let deg = Math.round(angle + 90);
      if (deg < 0) deg += 360;
      if (deg >= 360) deg -= 360;
      onUpdateLayer(selectedLayer.id, {
        rotation: deg,
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDragging(false);
    setIsResizing(false);
    setIsRotating(false);
    setIsPanning(false);
    setActiveHandle(null);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (err) {
      // Ignore
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden flex items-center justify-center bg-[#eef1f6] select-none touch-none"
    >
      {/* Zoom / Pan Wrapper */}
      <div
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: isPanning || isDragging || isResizing ? 'none' : 'transform 0.15s ease-out',
        }}
        className={`relative shadow-[0_12px_40px_rgba(15,23,42,0.14)] border border-slate-300 rounded-sm ${
          background.type === 'transparent' ? 'checkerboard-pattern' : 'bg-white'
        }`}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="block cursor-grab active:cursor-grabbing touch-none"
          style={{
            maxWidth: 'none',
            display: 'block',
          }}
        />
      </div>
    </div>
  );
};
