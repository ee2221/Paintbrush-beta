import React, { useState } from 'react';
import { useSceneStore } from '../store/sceneStore';

const CameraPerspectivePanel: React.FC = () => {
  const { cameraPerspective, setCameraPerspective } = useSceneStore();
  const [hoveredFace, setHoveredFace] = useState<string | null>(null);

  const handleFaceClick = (face: string) => {
    if (face === 'front') {
      // Toggle between front and back
      setCameraPerspective(cameraPerspective === 'front' ? 'back' : 'front');
    } else if (face === 'right') {
      // Toggle between right and left
      setCameraPerspective(cameraPerspective === 'right' ? 'left' : 'right');
    } else if (face === 'top') {
      // Toggle between top and bottom
      setCameraPerspective(cameraPerspective === 'top' ? 'bottom' : 'top');
    } else if (face === 'perspective') {
      setCameraPerspective('perspective');
    }
  };

  const getFaceColor = (face: string, baseColor: string) => {
    if (face === 'front' && (cameraPerspective === 'front' || cameraPerspective === 'back')) {
      return '#3b82f6';
    }
    if (face === 'right' && (cameraPerspective === 'right' || cameraPerspective === 'left')) {
      return '#10b981';
    }
    if (face === 'top' && (cameraPerspective === 'top' || cameraPerspective === 'bottom')) {
      return '#8b5cf6';
    }
    if (face === 'perspective' && cameraPerspective === 'perspective') {
      return '#f59e0b';
    }
    
    return hoveredFace === face ? '#4a5568' : baseColor;
  };

  return (
    <div className="absolute left-4 bottom-4">
      <svg
        viewBox="0 0 120 120"
        className="w-24 h-24 cursor-pointer"
        style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.6))' }}
      >
        {/* Front face */}
        <polygon
          points="30,45 90,45 90,90 30,90"
          fill={getFaceColor('front', '#2a2a2a')}
          stroke="white"
          strokeWidth="2"
          className="transition-all duration-200"
          onClick={() => handleFaceClick('front')}
          onMouseEnter={() => setHoveredFace('front')}
          onMouseLeave={() => setHoveredFace(null)}
        />
        
        {/* Right face (Side) */}
        <polygon
          points="90,45 110,30 110,75 90,90"
          fill={getFaceColor('right', '#1a1a1a')}
          stroke="white"
          strokeWidth="2"
          className="transition-all duration-200"
          onClick={() => handleFaceClick('right')}
          onMouseEnter={() => setHoveredFace('right')}
          onMouseLeave={() => setHoveredFace(null)}
        />
        
        {/* Top face */}
        <polygon
          points="30,45 50,30 110,30 90,45"
          fill={getFaceColor('top', '#333')}
          stroke="white"
          strokeWidth="2"
          className="transition-all duration-200"
          onClick={() => handleFaceClick('top')}
          onMouseEnter={() => setHoveredFace('top')}
          onMouseLeave={() => setHoveredFace(null)}
        />

        {/* Perspective center button */}
        <circle
          cx="60"
          cy="67"
          r="10"
          fill={getFaceColor('perspective', '#444')}
          stroke="white"
          strokeWidth="2"
          className="transition-all duration-200"
          onClick={() => handleFaceClick('perspective')}
          onMouseEnter={() => setHoveredFace('perspective')}
          onMouseLeave={() => setHoveredFace(null)}
        />
      </svg>
    </div>
  );
};

export default CameraPerspectivePanel;