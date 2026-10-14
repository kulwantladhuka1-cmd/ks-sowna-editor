export type CanvasPreset = {
  id: string;
  name: string;
  namePa: string;
  width: number;
  height: number;
  aspectRatio: string;
  iconName: string;
};

export type TextLayer = {
  id: string;
  type: 'text';
  name: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  locked: boolean;
  visible: boolean;

  // Typography
  fontFamily: string;
  fontSize: number;
  fontWeight: '400' | '600' | '700' | '800' | '900';
  fontStyle: 'normal' | 'italic';
  underline?: boolean;
  strikethrough?: boolean;
  textAlign: 'left' | 'center' | 'right';
  letterSpacing: number;
  lineHeight: number;

  // Fill
  fillType: 'solid' | 'gradient';
  color: string;
  gradientColors: [string, string];
  gradientAngle: number;

  // Effects
  stroke: {
    enabled: boolean;
    color: string;
    width: number;
  };
  doubleStroke?: {
    enabled: boolean;
    color: string;
    width: number;
  };
  shadow: {
    enabled: boolean;
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
  innerShadow?: {
    enabled: boolean;
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
  threeD?: {
    enabled: boolean;
    depth: number;
    color: string;
    angle: number;
    darkShading: number;
  };
  emboss?: {
    enabled: boolean;
    intensity: number;
    angle: number;
  };
  reflection?: {
    enabled: boolean;
    distance: number;
    opacity: number;
  };
  curved?: {
    enabled: boolean;
    radius: number; // positive = arc downwards/convex, negative = arc upwards
  };
  highlightBox?: {
    enabled: boolean;
    color: string;
    padding: number;
    radius: number;
  };
};

export type ImageLayer = {
  id: string;
  type: 'image';
  name: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  locked: boolean;
  visible: boolean;

  // Image controls
  flipH?: boolean;
  flipV?: boolean;
  borderRadius?: number;
  border?: {
    enabled: boolean;
    color: string;
    width: number;
  };
  shadow?: {
    enabled: boolean;
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
  filter?: {
    brightness: number; // 50 to 150 (default 100)
    contrast: number;   // 50 to 150 (default 100)
    saturation: number; // 0 to 200 (default 100)
    blur: number;       // 0 to 20 (default 0)
    warmth?: number;    // -50 to +50 (default 0)
    sepia?: number;     // 0 to 100 (default 0)
    grayscale?: number; // 0 to 100 (default 0)
    vignette?: number;  // 0 to 100 (default 0)
  };
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  manualMask?: string;
};

export type ShapeType =
  | 'rectangle'
  | 'roundedRect'
  | 'circle'
  | 'star'
  | 'crown'
  | 'shield'
  | 'triangle'
  | 'diamond'
  | 'heart'
  | 'badge'
  | 'line'
  | 'arrow'
  | 'ring';

export type ShapeLayer = {
  id: string;
  type: 'shape';
  name: string;
  shapeType: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  locked: boolean;
  visible: boolean;

  fillType: 'solid' | 'gradient' | 'none';
  fillColor: string;
  gradientColors: [string, string];
  gradientAngle: number;
  stroke: {
    enabled: boolean;
    color: string;
    width: number;
  };
  borderRadius?: number;
  shadow?: {
    enabled: boolean;
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
};

export type StickerLayer = {
  id: string;
  type: 'sticker';
  name: string;
  stickerId?: string;
  svgPath: string;
  viewBox: string;
  fillColor: string;
  gradientColors?: [string, string];
  useGradient?: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  locked: boolean;
  visible: boolean;
  flipH?: boolean;
  flipV?: boolean;
  shadow?: {
    enabled: boolean;
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
};

export type Layer = TextLayer | ImageLayer | ShapeLayer | StickerLayer;

export type CanvasBackground = {
  type: 'solid' | 'gradient' | 'image' | 'transparent';
  color: string;
  gradient?: {
    colors: [string, string];
    type: 'linear' | 'radial';
    angle: number;
  };
  imageSrc?: string;
  imageOpacity?: number;
  imageBlur?: number;
};

export type EditorState = {
  layers: Layer[];
  selectedLayerId: string | null;
  background: CanvasBackground;
  width: number;
  height: number;
  preset: string;
};

export type Template = {
  id: string;
  title: string;
  titlePa: string;
  name?: string;
  namePa?: string;
  category: 'youtube' | 'instagram' | 'reels' | 'punjabi' | 'logo' | 'news' | 'celebration' | 'gaming';
  preset: CanvasPreset;
  thumbnailGradient: string;
  background: CanvasBackground;
  layers: Layer[];
};

export type SavedProject = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
  state: EditorState;
};
