import React, { useRef, useEffect, useState } from 'react';
import { useSceneStore } from '../store/sceneStore';
import * as THREE from 'three';

interface PaintStroke {
  points: THREE.Vector2[];
  color: string;
  size: number;
  opacity: number;
  brushType: string;
  blendMode: string;
}

const PaintCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<PaintStroke | null>(null);
  const [paintStrokes, setPaintStrokes] = useState<PaintStroke[]>([]);
  
  const { 
    paintMode, 
    paintSettings, 
    selectedObject,
    isObjectLocked 
  } = useSceneStore();

  // Check if selected object is locked
  const selectedObj = useSceneStore.getState().objects.find(obj => obj.object === selectedObject);
  const objectLocked = selectedObj ? isObjectLocked(selectedObj.id) : false;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !paintMode) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match viewport
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [paintMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !paintMode || objectLocked || !selectedObject) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return; // Only left click
      
      setIsDrawing(true);
      const rect = canvas.getBoundingClientRect();
      const point = new THREE.Vector2(
        e.clientX - rect.left,
        e.clientY - rect.top
      );

      const newStroke: PaintStroke = {
        points: [point],
        color: paintSettings.primaryColor,
        size: paintSettings.brushSize,
        opacity: paintSettings.opacity,
        brushType: paintSettings.brushType,
        blendMode: paintSettings.blendMode
      };

      setCurrentStroke(newStroke);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDrawing || !currentStroke) return;

      const rect = canvas.getBoundingClientRect();
      const point = new THREE.Vector2(
        e.clientX - rect.left,
        e.clientY - rect.top
      );

      setCurrentStroke(prev => prev ? {
        ...prev,
        points: [...prev.points, point]
      } : null);
    };

    const handleMouseUp = () => {
      if (currentStroke && currentStroke.points.length > 0) {
        setPaintStrokes(prev => [...prev, currentStroke]);
        applyPaintToObject(currentStroke);
      }
      setIsDrawing(false);
      setCurrentStroke(null);
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [paintMode, isDrawing, currentStroke, paintSettings, objectLocked, selectedObject]);

  const applyPaintToObject = (stroke: PaintStroke) => {
    if (!selectedObject || !(selectedObject instanceof THREE.Mesh)) return;

    // Create or update paint texture
    const material = selectedObject.material as THREE.MeshStandardMaterial;
    
    // If no paint texture exists, create one
    if (!material.userData.paintTexture) {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 512, 512);
      }
      
      const texture = new THREE.CanvasTexture(canvas);
      material.userData.paintTexture = texture;
      material.userData.paintCanvas = canvas;
      
      // Blend with existing color
      const originalColor = material.color.clone();
      material.map = texture;
      material.color.setRGB(1, 1, 1); // Set to white to show texture colors
      material.userData.originalColor = originalColor;
      material.needsUpdate = true;
    }

    // Apply stroke to paint canvas
    const paintCanvas = material.userData.paintCanvas as HTMLCanvasElement;
    const paintCtx = paintCanvas.getContext('2d');
    if (!paintCtx) return;

    // Set up brush properties
    paintCtx.globalAlpha = stroke.opacity * paintSettings.flow;
    paintCtx.globalCompositeOperation = getCompositeOperation(stroke.blendMode);
    paintCtx.strokeStyle = stroke.color;
    paintCtx.fillStyle = stroke.color;
    paintCtx.lineWidth = stroke.size;
    paintCtx.lineCap = 'round';
    paintCtx.lineJoin = 'round';

    // Draw based on brush type
    switch (stroke.brushType) {
      case 'round':
        drawRoundBrush(paintCtx, stroke);
        break;
      case 'square':
        drawSquareBrush(paintCtx, stroke);
        break;
      case 'airbrush':
        drawAirbrush(paintCtx, stroke);
        break;
      case 'stipple':
        drawStipple(paintCtx, stroke);
        break;
      case 'gradient':
        drawGradient(paintCtx, stroke);
        break;
    }

    // Update texture
    const texture = material.userData.paintTexture as THREE.CanvasTexture;
    texture.needsUpdate = true;
  };

  const drawRoundBrush = (ctx: CanvasRenderingContext2D, stroke: PaintStroke) => {
    if (stroke.points.length < 2) {
      // Single point
      ctx.beginPath();
      ctx.arc(stroke.points[0].x, stroke.points[0].y, stroke.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Connected line
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }
  };

  const drawSquareBrush = (ctx: CanvasRenderingContext2D, stroke: PaintStroke) => {
    stroke.points.forEach(point => {
      const halfSize = stroke.size / 2;
      ctx.fillRect(
        point.x - halfSize,
        point.y - halfSize,
        stroke.size,
        stroke.size
      );
    });
  };

  const drawAirbrush = (ctx: CanvasRenderingContext2D, stroke: PaintStroke) => {
    stroke.points.forEach(point => {
      const gradient = ctx.createRadialGradient(
        point.x, point.y, 0,
        point.x, point.y, stroke.size / 2
      );
      
      const centerAlpha = stroke.opacity * paintSettings.hardness;
      gradient.addColorStop(0, `${stroke.color}${Math.round(centerAlpha * 255).toString(16).padStart(2, '0')}`);
      gradient.addColorStop(1, `${stroke.color}00`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(point.x, point.y, stroke.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const drawStipple = (ctx: CanvasRenderingContext2D, stroke: PaintStroke) => {
    stroke.points.forEach(point => {
      const density = paintSettings.textureStrength * 50;
      for (let i = 0; i < density; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * stroke.size / 2;
        const x = point.x + Math.cos(angle) * distance;
        const y = point.y + Math.sin(angle) * distance;
        const size = Math.random() * 3 + 1;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  };

  const drawGradient = (ctx: CanvasRenderingContext2D, stroke: PaintStroke) => {
    if (stroke.points.length < 2) return;

    const startPoint = stroke.points[0];
    const endPoint = stroke.points[stroke.points.length - 1];
    
    // Calculate gradient direction based on angle setting
    const angle = (paintSettings.gradientAngle * Math.PI) / 180;
    const distance = stroke.size;
    
    const gradientStart = {
      x: startPoint.x - Math.cos(angle) * distance / 2,
      y: startPoint.y - Math.sin(angle) * distance / 2
    };
    
    const gradientEnd = {
      x: startPoint.x + Math.cos(angle) * distance / 2,
      y: startPoint.y + Math.sin(angle) * distance / 2
    };

    const gradient = ctx.createLinearGradient(
      gradientStart.x, gradientStart.y,
      gradientEnd.x, gradientEnd.y
    );
    
    gradient.addColorStop(0, paintSettings.primaryColor);
    gradient.addColorStop(1, paintSettings.secondaryColor);
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = stroke.size;
    ctx.beginPath();
    ctx.moveTo(startPoint.x, startPoint.y);
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    ctx.stroke();
  };

  const getCompositeOperation = (blendMode: string): GlobalCompositeOperation => {
    switch (blendMode) {
      case 'multiply': return 'multiply';
      case 'screen': return 'screen';
      case 'overlay': return 'overlay';
      case 'soft-light': return 'soft-light';
      case 'hard-light': return 'hard-light';
      case 'color-dodge': return 'color-dodge';
      case 'color-burn': return 'color-burn';
      default: return 'source-over';
    }
  };

  // Render current stroke preview
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentStroke) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw current stroke
    ctx.globalAlpha = currentStroke.opacity;
    ctx.strokeStyle = currentStroke.color;
    ctx.fillStyle = currentStroke.color;
    ctx.lineWidth = currentStroke.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (currentStroke.points.length > 0) {
      switch (currentStroke.brushType) {
        case 'round':
          if (currentStroke.points.length === 1) {
            ctx.beginPath();
            ctx.arc(currentStroke.points[0].x, currentStroke.points[0].y, currentStroke.size / 2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.moveTo(currentStroke.points[0].x, currentStroke.points[0].y);
            for (let i = 1; i < currentStroke.points.length; i++) {
              ctx.lineTo(currentStroke.points[i].x, currentStroke.points[i].y);
            }
            ctx.stroke();
          }
          break;
        // Add other brush type previews as needed
      }
    }
  }, [currentStroke]);

  if (!paintMode) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-auto z-20 ${
        objectLocked || !selectedObject ? 'cursor-not-allowed' : 'cursor-crosshair'
      }`}
      style={{
        pointerEvents: paintMode ? 'auto' : 'none',
        opacity: objectLocked || !selectedObject ? 0.3 : 1
      }}
    />
  );
};

export default PaintCanvas;