import React, { useRef, useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { useSceneStore } from '../store/sceneStore';
import * as THREE from 'three';

interface PaintStroke {
  points: THREE.Vector3[];
  uvPoints: THREE.Vector2[];
  color: string;
  size: number;
  opacity: number;
  brushType: string;
  blendMode: string;
}

const PaintCanvas: React.FC = () => {
  const { camera, raycaster, scene } = useThree();
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<PaintStroke | null>(null);
  const [paintStrokes, setPaintStrokes] = useState<PaintStroke[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
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
    if (!paintMode || objectLocked || !selectedObject) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return; // Only left click
      
      const intersection = getIntersectionPoint(e);
      if (!intersection) return;

      setIsDrawing(true);
      
      const newStroke: PaintStroke = {
        points: [intersection.point],
        uvPoints: intersection.uv ? [intersection.uv] : [],
        color: paintSettings.primaryColor,
        size: paintSettings.brushSize,
        opacity: paintSettings.opacity,
        brushType: paintSettings.brushType,
        blendMode: paintSettings.blendMode
      };

      setCurrentStroke(newStroke);
      applyPaintToObject(newStroke);
    };

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });

      if (!isDrawing || !currentStroke) return;

      const intersection = getIntersectionPoint(e);
      if (!intersection) return;

      const updatedStroke = {
        ...currentStroke,
        points: [...currentStroke.points, intersection.point],
        uvPoints: intersection.uv ? [...currentStroke.uvPoints, intersection.uv] : currentStroke.uvPoints
      };

      setCurrentStroke(updatedStroke);
      applyPaintToObject(updatedStroke);
    };

    const handleMouseUp = () => {
      if (currentStroke && currentStroke.points.length > 0) {
        setPaintStrokes(prev => [...prev, currentStroke]);
      }
      setIsDrawing(false);
      setCurrentStroke(null);
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [paintMode, isDrawing, currentStroke, paintSettings, objectLocked, selectedObject, camera, raycaster]);

  const getIntersectionPoint = (e: MouseEvent) => {
    if (!selectedObject || !(selectedObject instanceof THREE.Mesh)) return null;

    // Convert mouse position to normalized device coordinates
    const rect = document.querySelector('canvas')?.getBoundingClientRect();
    if (!rect) return null;

    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(selectedObject);

    if (intersects.length > 0) {
      return {
        point: intersects[0].point,
        uv: intersects[0].uv,
        face: intersects[0].face
      };
    }

    return null;
  };

  const applyPaintToObject = (stroke: PaintStroke) => {
    if (!selectedObject || !(selectedObject instanceof THREE.Mesh)) return;
    if (stroke.uvPoints.length === 0) return;

    const material = selectedObject.material as THREE.MeshStandardMaterial;
    
    // Create or get paint texture
    if (!material.userData.paintTexture) {
      createPaintTexture(material);
    }

    const paintCanvas = material.userData.paintCanvas as HTMLCanvasElement;
    const paintCtx = paintCanvas.getContext('2d');
    if (!paintCtx) return;

    // Set up brush properties
    paintCtx.globalAlpha = stroke.opacity * paintSettings.flow;
    paintCtx.globalCompositeOperation = getCompositeOperation(stroke.blendMode);
    paintCtx.strokeStyle = stroke.color;
    paintCtx.fillStyle = stroke.color;
    paintCtx.lineCap = 'round';
    paintCtx.lineJoin = 'round';

    // Convert UV coordinates to canvas coordinates
    const canvasPoints = stroke.uvPoints.map(uv => ({
      x: uv.x * paintCanvas.width,
      y: (1 - uv.y) * paintCanvas.height // Flip Y coordinate
    }));

    // Draw based on brush type
    switch (stroke.brushType) {
      case 'round':
        drawRoundBrush(paintCtx, canvasPoints, stroke.size);
        break;
      case 'square':
        drawSquareBrush(paintCtx, canvasPoints, stroke.size);
        break;
      case 'airbrush':
        drawAirbrush(paintCtx, canvasPoints, stroke);
        break;
      case 'stipple':
        drawStipple(paintCtx, canvasPoints, stroke);
        break;
      case 'gradient':
        drawGradient(paintCtx, canvasPoints, stroke);
        break;
    }

    // Update texture
    const texture = material.userData.paintTexture as THREE.CanvasTexture;
    texture.needsUpdate = true;
  };

  const createPaintTexture = (material: THREE.MeshStandardMaterial) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Start with a transparent canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // If the material has an existing texture, draw it as the base
      if (material.map) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          texture.needsUpdate = true;
        };
        img.src = (material.map as any).image?.src || '';
      }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.flipY = false; // Important for UV mapping
    
    // Store references
    material.userData.paintTexture = texture;
    material.userData.paintCanvas = canvas;
    material.userData.originalMap = material.map;
    material.userData.originalColor = material.color.clone();
    
    // Apply the paint texture
    material.map = texture;
    material.needsUpdate = true;
  };

  const drawRoundBrush = (ctx: CanvasRenderingContext2D, points: {x: number, y: number}[], size: number) => {
    const brushSize = (size / 100) * Math.min(ctx.canvas.width, ctx.canvas.height) * 0.1;
    
    if (points.length === 1) {
      // Single point
      ctx.beginPath();
      ctx.arc(points[0].x, points[0].y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (points.length > 1) {
      // Connected line
      ctx.lineWidth = brushSize;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
    }
  };

  const drawSquareBrush = (ctx: CanvasRenderingContext2D, points: {x: number, y: number}[], size: number) => {
    const brushSize = (size / 100) * Math.min(ctx.canvas.width, ctx.canvas.height) * 0.1;
    
    points.forEach(point => {
      const halfSize = brushSize / 2;
      ctx.fillRect(
        point.x - halfSize,
        point.y - halfSize,
        brushSize,
        brushSize
      );
    });
  };

  const drawAirbrush = (ctx: CanvasRenderingContext2D, points: {x: number, y: number}[], stroke: PaintStroke) => {
    const brushSize = (stroke.size / 100) * Math.min(ctx.canvas.width, ctx.canvas.height) * 0.1;
    
    points.forEach(point => {
      const gradient = ctx.createRadialGradient(
        point.x, point.y, 0,
        point.x, point.y, brushSize / 2
      );
      
      const centerAlpha = stroke.opacity * paintSettings.hardness;
      const color = stroke.color;
      
      // Convert hex to rgba
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${centerAlpha})`);
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(point.x, point.y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const drawStipple = (ctx: CanvasRenderingContext2D, points: {x: number, y: number}[], stroke: PaintStroke) => {
    const brushSize = (stroke.size / 100) * Math.min(ctx.canvas.width, ctx.canvas.height) * 0.1;
    
    points.forEach(point => {
      const density = paintSettings.textureStrength * 20;
      for (let i = 0; i < density; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * brushSize / 2;
        const x = point.x + Math.cos(angle) * distance;
        const y = point.y + Math.sin(angle) * distance;
        const dotSize = Math.random() * 3 + 1;
        
        ctx.beginPath();
        ctx.arc(x, y, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  };

  const drawGradient = (ctx: CanvasRenderingContext2D, points: {x: number, y: number}[], stroke: PaintStroke) => {
    if (points.length < 2) return;

    const brushSize = (stroke.size / 100) * Math.min(ctx.canvas.width, ctx.canvas.height) * 0.1;
    const startPoint = points[0];
    const endPoint = points[points.length - 1];
    
    // Calculate gradient direction based on angle setting
    const angle = (paintSettings.gradientAngle * Math.PI) / 180;
    const distance = brushSize;
    
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
    ctx.lineWidth = brushSize;
    ctx.beginPath();
    ctx.moveTo(startPoint.x, startPoint.y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
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

  // Render brush cursor
  if (!paintMode || objectLocked || !selectedObject) return null;

  return (
    <div
      className="fixed pointer-events-none z-30"
      style={{
        left: mousePosition.x - paintSettings.brushSize / 2,
        top: mousePosition.y - paintSettings.brushSize / 2,
        width: paintSettings.brushSize,
        height: paintSettings.brushSize,
        borderRadius: paintSettings.brushType === 'round' ? '50%' : '0%',
        border: '2px solid rgba(255, 255, 255, 0.8)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none'
      }}
    />
  );
};

export default PaintCanvas;