/**
 * Streamlit Video Annotator Component
 *
 * A React component for annotating videos with drawable regions
 * and time-range markers.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Streamlit } from 'streamlit-component-lib';
import { Annotation, Shape, DrawingTool, Labels, ComponentValue, DEFAULT_COLORS, Theme } from './types';
import './VideoAnnotator.css';

interface Props {
  videoUrl: string;
  existingAnnotations: Annotation[];
  height: number;
  labels: Labels;
  colors?: string[];
  theme?: Theme;
}

const PLAYBACK_RATES = [1, 2, 4] as const;

/** Generate a UUID v4 */
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Format seconds as MM:SS */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/** Get single-letter indicator for shape type */
function getShapeIndicator(shapeType: Shape['type']): string {
  switch (shapeType) {
    case 'rectangle': return 'R';
    case 'circle': return 'C';
    case 'path': return 'P';
    case 'arrow': return 'A';
  }
}

/** Get localized shape name for instructions */
function getShapeName(tool: DrawingTool, labels: Labels): string {
  switch (tool) {
    case 'rectangle': return labels.rectangle.toLowerCase();
    case 'circle': return labels.circle.toLowerCase();
    case 'path': return (labels.freedraw || 'freedraw').toLowerCase();
    case 'arrow': return (labels.arrow || 'arrow').toLowerCase();
    default: return '';
  }
}

/**
 * Get point on Catmull-Rom curve for smooth path drawing
 */
function getCatmullRomPoint(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  t: number
): { x: number; y: number } {
  const t2 = t * t;
  const t3 = t2 * t;

  const c1 = 2 * p1.x;
  const c2 = -p0.x + p2.x;
  const c3 = 2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x;
  const c4 = -p0.x + 3 * p1.x - 3 * p2.x + p3.x;
  const x = 0.5 * (c1 + c2 * t + c3 * t2 + c4 * t3);

  const d1 = 2 * p1.y;
  const d2 = -p0.y + p2.y;
  const d3 = 2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y;
  const d4 = -p0.y + 3 * p1.y - 3 * p2.y + p3.y;
  const y = 0.5 * (d1 + d2 * t + d3 * t2 + d4 * t3);

  return { x, y };
}

/**
 * Draw smooth curve through points using Catmull-Rom spline
 */
function drawSmoothPath(
  ctx: CanvasRenderingContext2D,
  points: Array<{ x: number; y: number }>,
  canvasWidth: number,
  canvasHeight: number
) {
  if (points.length < 2) return;

  const canvasPoints = points.map(p => ({
    x: p.x * canvasWidth,
    y: p.y * canvasHeight
  }));

  ctx.beginPath();
  ctx.moveTo(canvasPoints[0].x, canvasPoints[0].y);

  if (canvasPoints.length === 2) {
    ctx.lineTo(canvasPoints[1].x, canvasPoints[1].y);
  } else {
    for (let i = 0; i < canvasPoints.length - 1; i++) {
      const p0 = canvasPoints[Math.max(0, i - 1)];
      const p1 = canvasPoints[i];
      const p2 = canvasPoints[i + 1];
      const p3 = canvasPoints[Math.min(canvasPoints.length - 1, i + 2)];

      const segments = 10;
      for (let t = 0; t <= segments; t++) {
        const point = getCatmullRomPoint(p0, p1, p2, p3, t / segments);
        ctx.lineTo(point.x, point.y);
      }
    }
  }

  ctx.stroke();
}

/**
 * Draw arrow with filled triangle arrowhead
 */
function drawArrow(
  ctx: CanvasRenderingContext2D,
  shape: { x: number; y: number; endX: number; endY: number; color: string },
  canvasWidth: number,
  canvasHeight: number
) {
  const x1 = shape.x * canvasWidth;
  const y1 = shape.y * canvasHeight;
  const x2 = shape.endX * canvasWidth;
  const y2 = shape.endY * canvasHeight;

  // Draw line
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // Calculate arrowhead
  const dx = x2 - x1;
  const dy = y2 - y1;
  const angle = Math.atan2(dy, dx);
  const length = Math.sqrt(dx * dx + dy * dy);

  const arrowSize = Math.min(15, length * 0.1);
  const arrowAngle = Math.PI / 6;

  const arrowPoint1 = {
    x: x2 - arrowSize * Math.cos(angle - arrowAngle),
    y: y2 - arrowSize * Math.sin(angle - arrowAngle)
  };
  const arrowPoint2 = {
    x: x2 - arrowSize * Math.cos(angle + arrowAngle),
    y: y2 - arrowSize * Math.sin(angle + arrowAngle)
  };

  // Draw filled arrowhead
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(arrowPoint1.x, arrowPoint1.y);
  ctx.lineTo(arrowPoint2.x, arrowPoint2.y);
  ctx.closePath();
  ctx.fillStyle = shape.color;
  ctx.fill();
  ctx.stroke();
}

function VideoAnnotator({
  videoUrl,
  existingAnnotations,
  height,
  labels,
  colors = DEFAULT_COLORS,
  theme,
}: Props): JSX.Element {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sentAnnotationsRef = useRef<Set<string>>(new Set());
  const sentDeletionsRef = useRef<Set<string>>(new Set());
  const savedTimeRef = useRef(0);
  const wasPlayingRef = useRef(false);
  const initialLoadRef = useRef(true);

  // State
  const [annotations, setAnnotations] = useState<Annotation[]>(existingAnnotations);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [playbackRateIndex, setPlaybackRateIndex] = useState(0);

  const [selectedTool, setSelectedTool] = useState<DrawingTool>(null);
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);

  const [markedStartTime, setMarkedStartTime] = useState<number | null>(null);
  const [markedEndTime, setMarkedEndTime] = useState<number | null>(null);
  const [pendingShape, setPendingShape] = useState<Shape | null>(null);
  const [comment, setComment] = useState('');

  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // Set CSS variables from Streamlit theme
  useEffect(function applyTheme(): void {
    if (theme && containerRef.current) {
      const root = containerRef.current;
      root.style.setProperty('--primary-color', theme.primaryColor);
      root.style.setProperty('--background-color', theme.backgroundColor);
      root.style.setProperty('--secondary-background-color', theme.secondaryBackgroundColor);
      root.style.setProperty('--text-color', theme.textColor);
      root.style.setProperty('--font', theme.font);
      root.dataset.theme = theme.base;
    }
  }, [theme]);

  // Initialize annotations from props (only on first load)
  useEffect(function initializeAnnotations(): void {
    if (initialLoadRef.current) {
      setAnnotations(existingAnnotations);
      initialLoadRef.current = false;
    }
  }, [existingAnnotations]);

  // Restore video state after re-render
  useEffect(function restoreVideoState(): void {
    const video = videoRef.current;
    if (video && videoLoaded && savedTimeRef.current > 0) {
      video.currentTime = savedTimeRef.current;
      if (wasPlayingRef.current) {
        video.play().catch(() => {});
      }
    }
  }, [videoLoaded]);

  // Apply playback rate when video is ready or rate changes
  useEffect(function applyPlaybackRate(): void {
    if (videoRef.current) {
      videoRef.current.playbackRate = PLAYBACK_RATES[playbackRateIndex];
    }
  }, [videoLoaded, playbackRateIndex]);

  // Reset playback rate when video source changes
  useEffect(function resetPlaybackRate(): void {
    setPlaybackRateIndex(0);
  }, [videoUrl]);

  // Handle canvas resize with ResizeObserver
  useEffect(function observeCanvasResize(): void | (() => void) {
    function updateCanvasSize(): void {
      const video = videoRef.current;
      if (!video) return;

      const rect = video.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    }

    const video = videoRef.current;
    if (!video) return;

    const resizeObserver = new ResizeObserver(updateCanvasSize);
    resizeObserver.observe(video);
    updateCanvasSize();

    return () => resizeObserver.disconnect();
  }, [videoUrl]);

  // Video event handlers
  const handleLoadedMetadata = useCallback(function handleLoadedMetadata(): void {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setVideoLoaded(true);
    }
  }, []);

  const handleTimeUpdate = useCallback(function handleTimeUpdate(): void {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      savedTimeRef.current = time;
    }
  }, []);

  const handlePlay = useCallback(function handlePlay(): void {
    setIsPlaying(true);
    wasPlayingRef.current = true;
  }, []);

  const handlePause = useCallback(function handlePause(): void {
    setIsPlaying(false);
    wasPlayingRef.current = false;
  }, []);

  // Get shapes visible at current time
  const getVisibleShapes = useCallback(function getVisibleShapes(): Shape[] {
    return annotations
      .filter((a) => currentTime >= a.startTime && currentTime <= a.endTime)
      .map((a) => a.shape);
  }, [annotations, currentTime]);

  // Update canvas dimensions
  useEffect(function syncCanvasSize(): void {
    const canvas = canvasRef.current;
    if (!canvas || canvasSize.width === 0) return;
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
  }, [canvasSize]);

  // Draw shapes on canvas
  useEffect(function renderCanvas(): void {
    const canvas = canvasRef.current;
    if (!canvas || canvasSize.width === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw visible annotations
    const visibleShapes = getVisibleShapes();
    visibleShapes.forEach((shape) => {
      drawShape(ctx, shape, canvas.width, canvas.height, 3, '33');
    });

    // Draw shape being drawn (dashed)
    if (currentShape) {
      ctx.setLineDash([5, 5]);
      drawShape(ctx, currentShape, canvas.width, canvas.height, 3, '33');
      ctx.setLineDash([]);
    }

    // Draw pending shape (thicker, more opaque)
    if (pendingShape) {
      drawShape(ctx, pendingShape, canvas.width, canvas.height, 4, '55');
    }
  }, [currentTime, getVisibleShapes, currentShape, pendingShape, canvasSize]);

  /** Helper to draw a shape on canvas */
  function drawShape(
    ctx: CanvasRenderingContext2D,
    shape: Shape,
    canvasWidth: number,
    canvasHeight: number,
    lineWidth: number,
    fillOpacity: string
  ): void {
    ctx.strokeStyle = shape.color;
    ctx.lineWidth = lineWidth;

    switch (shape.type) {
      case 'path':
        drawSmoothPath(ctx, shape.points, canvasWidth, canvasHeight);
        break;

      case 'arrow':
        drawArrow(ctx, shape, canvasWidth, canvasHeight);
        break;

      case 'rectangle': {
        ctx.fillStyle = shape.color + fillOpacity;
        const x = shape.x * canvasWidth;
        const y = shape.y * canvasHeight;
        const w = shape.width * canvasWidth;
        const h = shape.height * canvasHeight;
        ctx.fillRect(x - w / 2, y - h / 2, w, h);
        ctx.strokeRect(x - w / 2, y - h / 2, w, h);
        break;
      }

      case 'circle': {
        ctx.fillStyle = shape.color + fillOpacity;
        const x = shape.x * canvasWidth;
        const y = shape.y * canvasHeight;
        const r = shape.radius * canvasWidth;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;
      }
    }
  }

  /** Get normalized coordinates from mouse event */
  function getNormalizedCoords(e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  }

  // Mouse handlers for drawing
  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>): void {
    if (!selectedTool || pendingShape) return;

    const coords = getNormalizedCoords(e);
    setIsDrawing(true);
    setDrawStart(coords);

    if (selectedTool === 'path') {
      setCurrentShape({
        id: generateId(),
        type: 'path',
        points: [coords],
        color: selectedColor,
      });
    } else if (selectedTool === 'arrow') {
      setCurrentShape({
        id: generateId(),
        type: 'arrow',
        x: coords.x,
        y: coords.y,
        endX: coords.x,
        endY: coords.y,
        color: selectedColor,
      });
    } else {
      setCurrentShape({
        id: generateId(),
        type: selectedTool,
        x: coords.x,
        y: coords.y,
        width: 0,
        height: 0,
        radius: 0,
        color: selectedColor,
      });
    }
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>): void {
    if (!isDrawing || !currentShape) return;

    const coords = getNormalizedCoords(e);

    switch (currentShape.type) {
      case 'path': {
        const lastPoint = currentShape.points[currentShape.points.length - 1];
        const dx = coords.x - lastPoint.x;
        const dy = coords.y - lastPoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0.005) {
          setCurrentShape({
            ...currentShape,
            points: [...currentShape.points, coords],
          });
        }
        break;
      }

      case 'arrow':
        setCurrentShape({
          ...currentShape,
          endX: coords.x,
          endY: coords.y,
        });
        break;

      case 'rectangle':
        setCurrentShape({
          ...currentShape,
          x: (drawStart.x + coords.x) / 2,
          y: (drawStart.y + coords.y) / 2,
          width: Math.abs(coords.x - drawStart.x),
          height: Math.abs(coords.y - drawStart.y),
        });
        break;

      case 'circle': {
        const dx = coords.x - drawStart.x;
        const dy = coords.y - drawStart.y;
        setCurrentShape({
          ...currentShape,
          x: drawStart.x,
          y: drawStart.y,
          radius: Math.sqrt(dx * dx + dy * dy),
        });
        break;
      }
    }
  }

  /** Check if a shape has sufficient size to be valid */
  function shapeHasValidSize(shape: Shape): boolean {
    switch (shape.type) {
      case 'path':
        return shape.points.length >= 3;
      case 'arrow': {
        const dx = shape.endX - shape.x;
        const dy = shape.endY - shape.y;
        return Math.sqrt(dx * dx + dy * dy) > 0.02;
      }
      case 'rectangle':
        return shape.width > 0.01 && shape.height > 0.01;
      case 'circle':
        return shape.radius > 0.01;
    }
  }

  function handleMouseUp(): void {
    if (!isDrawing || !currentShape) return;

    if (shapeHasValidSize(currentShape)) {
      setPendingShape(currentShape);
    }

    setIsDrawing(false);
    setCurrentShape(null);
  }

  // Time marker handlers
  function handleMarkStart(): void {
    setMarkedStartTime(currentTime);
    if (markedEndTime !== null && currentTime > markedEndTime) {
      setMarkedEndTime(null);
    }
  }

  function handleMarkEnd(): void {
    if (markedStartTime !== null && currentTime >= markedStartTime) {
      setMarkedEndTime(currentTime);
    } else if (markedStartTime === null) {
      setMarkedStartTime(0);
      setMarkedEndTime(currentTime);
    }
  }

  // Save annotation
  function handleSave(): void {
    if (!pendingShape || markedStartTime === null || markedEndTime === null) return;

    const newAnnotation: Annotation = {
      id: generateId(),
      startTime: markedStartTime,
      endTime: markedEndTime,
      shape: pendingShape,
      comment,
      createdAt: new Date().toISOString(),
    };

    if (sentAnnotationsRef.current.has(newAnnotation.id)) return;

    const newAnnotations = [...annotations, newAnnotation];
    setAnnotations(newAnnotations);
    sentAnnotationsRef.current.add(newAnnotation.id);

    // Reset state
    setPendingShape(null);
    setMarkedStartTime(null);
    setMarkedEndTime(null);
    setComment('');
    setSelectedTool(null);

    // Send to Streamlit
    setTimeout(function notifyStreamlit(): void {
      const value: ComponentValue = { annotations: newAnnotations, newAnnotation };
      Streamlit.setComponentValue(value);
    }, 100);
  }

  function handleCancel(): void {
    setPendingShape(null);
    setMarkedStartTime(null);
    setMarkedEndTime(null);
    setComment('');
    setCurrentShape(null);
    setIsDrawing(false);
  }

  // Delete annotation
  function handleDelete(id: string): void {
    if (sentDeletionsRef.current.has(id)) return;

    const newAnnotations = annotations.filter((a) => a.id !== id);
    setAnnotations(newAnnotations);
    sentDeletionsRef.current.add(id);

    setTimeout(function notifyStreamlit(): void {
      const value: ComponentValue = { annotations: newAnnotations, deletedAnnotationId: id };
      Streamlit.setComponentValue(value);
    }, 100);
  }

  function handleSeekToAnnotation(annotation: Annotation): void {
    if (videoRef.current) {
      videoRef.current.currentTime = annotation.startTime;
    }
  }

  function togglePlayPause(): void {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  }

  function togglePlaybackRate(): void {
    setPlaybackRateIndex((prev) => (prev + 1) % PLAYBACK_RATES.length);
  }

  return (
    <div className="video-annotator" style={{ height }} ref={containerRef}>
      <div className="main-content">
        <div className="video-section">
          <div className="video-container">
            <video
              ref={videoRef}
              src={videoUrl}
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              onPlay={handlePlay}
              onPause={handlePause}
            />
            <canvas
              ref={canvasRef}
              className={`drawing-canvas${selectedTool && !pendingShape ? ' drawing-mode' : ''}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>

          {/* Video controls */}
          <div className="video-controls">
            <button className="play-pause-btn" onClick={togglePlayPause}>
              {isPlaying ? `⏸ ${labels.pause}` : `▶ ${labels.play}`}
            </button>
            <button className="playback-speed-btn" onClick={togglePlaybackRate}>
              ⏩ {PLAYBACK_RATES[playbackRateIndex]}x
            </button>
            <input
              type="range"
              className="seek-slider"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={(e) => {
                if (videoRef.current) {
                  videoRef.current.currentTime = parseFloat(e.target.value);
                }
              }}
            />
            <div className="time-display">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          {/* Tools bar */}
          <div className="controls-bar">
            <div className="tool-section">
              <span className="section-label">{labels.tools}:</span>
              <button
                className={`tool-btn ${selectedTool === 'rectangle' ? 'active' : ''}`}
                onClick={() => setSelectedTool(selectedTool === 'rectangle' ? null : 'rectangle')}
                disabled={!!pendingShape}
              >
                {labels.rectangle}
              </button>
              <button
                className={`tool-btn ${selectedTool === 'circle' ? 'active' : ''}`}
                onClick={() => setSelectedTool(selectedTool === 'circle' ? null : 'circle')}
                disabled={!!pendingShape}
              >
                {labels.circle}
              </button>
              <button
                className={`tool-btn ${selectedTool === 'path' ? 'active' : ''}`}
                onClick={() => setSelectedTool(selectedTool === 'path' ? null : 'path')}
                disabled={!!pendingShape}
              >
                {labels.freedraw || 'Freedraw'}
              </button>
              <button
                className={`tool-btn ${selectedTool === 'arrow' ? 'active' : ''}`}
                onClick={() => setSelectedTool(selectedTool === 'arrow' ? null : 'arrow')}
                disabled={!!pendingShape}
              >
                {labels.arrow || 'Arrow'}
              </button>
            </div>

            <div className="color-section">
              <span className="section-label">{labels.color}:</span>
              {colors.map((color) => (
                <button
                  key={color}
                  className={`color-btn ${selectedColor === color ? 'active' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                  disabled={!!pendingShape}
                />
              ))}
            </div>
          </div>

          {/* Time markers */}
          <div className="time-markers">
            <button className="marker-btn start" onClick={handleMarkStart}>
              {labels.markStart}
            </button>
            <div className="marked-times">
              {markedStartTime !== null && (
                <span className="time-badge start">
                  {labels.start}: {formatTime(markedStartTime)}
                </span>
              )}
              {markedEndTime !== null && (
                <span className="time-badge end">
                  {labels.end}: {formatTime(markedEndTime)}
                </span>
              )}
            </div>
            <button className="marker-btn end" onClick={handleMarkEnd}>
              {labels.markEnd}
            </button>
          </div>

          {/* Annotation form */}
          {pendingShape && markedStartTime !== null && markedEndTime !== null && (
            <div className="annotation-form">
              <textarea
                placeholder={labels.commentPlaceholder}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
              />
              <div className="form-buttons">
                <button className="save-btn" onClick={handleSave}>
                  {labels.saveAnnotation}
                </button>
                <button className="cancel-btn" onClick={handleCancel}>
                  {labels.cancel}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Annotations panel */}
        <div className="annotations-panel">
          <h3>
            {labels.annotations} ({annotations.length})
          </h3>
          {annotations.length === 0 ? (
            <p className="empty-message">{labels.noAnnotations}</p>
          ) : (
            <ul className="annotation-list">
              {annotations.map((ann) => (
                <li
                  key={ann.id}
                  className="annotation-item"
                  onClick={() => handleSeekToAnnotation(ann)}
                >
                  <div className="annotation-header">
                    <span className="annotation-time">
                      {formatTime(ann.startTime)} - {formatTime(ann.endTime)}
                    </span>
                    <span
                      className="shape-indicator"
                      style={{ backgroundColor: ann.shape.color }}
                    >
                      {getShapeIndicator(ann.shape.type)}
                    </span>
                    <button
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(ann.id);
                      }}
                    >
                      {labels.delete}
                    </button>
                  </div>
                  {ann.comment && <p className="annotation-comment">{ann.comment}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Instruction banner */}
      {selectedTool && !pendingShape && (
        <div className="instruction-banner">
          {labels.drawInstruction.replace('{shape}', getShapeName(selectedTool, labels))}
        </div>
      )}
    </div>
  );
}

export default VideoAnnotator;
