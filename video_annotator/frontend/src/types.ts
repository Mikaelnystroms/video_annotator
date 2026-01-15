/**
 * Streamlit Video Annotator - Type Definitions
 */

/**
 * Shape type for drawable regions.
 * Coordinates are normalized (0-1) for resolution independence.
 */

// Base shape properties
interface BaseShape {
  id: string;
  color: string;
}

// Rectangle shape
interface RectangleShape extends BaseShape {
  type: 'rectangle';
  /** Center X coordinate (0-1) */
  x: number;
  /** Center Y coordinate (0-1) */
  y: number;
  /** Width (0-1) */
  width: number;
  /** Height (0-1) */
  height: number;
}

// Circle shape
interface CircleShape extends BaseShape {
  type: 'circle';
  /** Center X coordinate (0-1) */
  x: number;
  /** Center Y coordinate (0-1) */
  y: number;
  /** Radius (0-1, relative to video width) */
  radius: number;
}

// Path (freedraw) shape
interface PathShape extends BaseShape {
  type: 'path';
  /** Array of points forming the path */
  points: Array<{ x: number; y: number }>;
}

// Arrow shape
interface ArrowShape extends BaseShape {
  type: 'arrow';
  /** Start X coordinate (0-1) */
  x: number;
  /** Start Y coordinate (0-1) */
  y: number;
  /** End X coordinate (0-1) */
  endX: number;
  /** End Y coordinate (0-1) */
  endY: number;
}

export type Shape = RectangleShape | CircleShape | PathShape | ArrowShape;

/**
 * Annotation with time range and shape
 */
export interface Annotation {
  id: string;
  /** Start time in seconds */
  startTime: number;
  /** End time in seconds */
  endTime: number;
  /** Shape data for the annotated region */
  shape: Shape;
  /** User comment */
  comment: string;
  /** ISO 8601 timestamp */
  createdAt: string;
}

/**
 * Drawing tool types
 */
export type DrawingTool = 'rectangle' | 'circle' | 'path' | 'arrow' | null;

/**
 * UI Labels for internationalization
 */
export interface Labels {
  play: string;
  pause: string;
  tools: string;
  rectangle: string;
  circle: string;
  freedraw?: string;
  arrow?: string;
  color: string;
  markStart: string;
  markEnd: string;
  start: string;
  end: string;
  saveAnnotation: string;
  cancel: string;
  annotations: string;
  noAnnotations: string;
  delete: string;
  commentPlaceholder: string;
  drawInstruction: string;
}

/**
 * Props received from Streamlit
 */
export interface ComponentArgs {
  videoUrl: string;
  existingAnnotations: Annotation[];
  height: number;
  labels: Labels;
  colors?: string[];
}

/**
 * Value sent back to Streamlit
 */
export interface ComponentValue {
  annotations: Annotation[];
  newAnnotation?: Annotation;
  deletedAnnotationId?: string;
}

/**
 * Default color palette
 */
export const DEFAULT_COLORS = [
  '#00ff00',
  '#ff0000',
  '#0000ff',
  '#ffff00',
  '#ff00ff',
  '#00ffff',
];

/**
 * Streamlit theme object passed to components
 */
export interface Theme {
  base: 'light' | 'dark';
  primaryColor: string;
  backgroundColor: string;
  secondaryBackgroundColor: string;
  textColor: string;
  font: string;
}
