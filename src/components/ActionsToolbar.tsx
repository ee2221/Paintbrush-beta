import React from 'react';
import { 
  Undo,
  Redo,
  Copy,
  FlipHorizontal,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { useSceneStore } from '../store/sceneStore';

const ActionsToolbar: React.FC = () => {
  const {
    selectedObject,
    undo,
    redo,
    canUndo,
    canRedo,
    duplicateObject,
    mirrorObject,
    zoomIn,
    zoomOut
  } = useSceneStore();

  const actionTools = [
    {
      icon: Undo,
      action: undo,
      title: 'Undo',
      disabled: !canUndo,
      shortcut: 'Ctrl+Z'
    },
    {
      icon: Redo,
      action: redo,
      title: 'Redo',
      disabled: !canRedo,
      shortcut: 'Ctrl+Y'
    },
    {
      icon: Copy,
      action: duplicateObject,
      title: 'Duplicate',
      disabled: !selectedObject,
      shortcut: 'Ctrl+D'
    },
    {
      icon: FlipHorizontal,
      action: mirrorObject,
      title: 'Mirror',
      disabled: !selectedObject,
      shortcut: 'Ctrl+M'
    },
    {
      icon: ZoomIn,
      action: zoomIn,
      title: 'Zoom In',
      disabled: false,
      shortcut: '+'
    },
    {
      icon: ZoomOut,
      action: zoomOut,
      title: 'Zoom Out',
      disabled: false,
      shortcut: '-'
    }
  ] as const;

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-[#1a1a1a] rounded-xl shadow-2xl shadow-black/20 p-3 border border-white/5 z-10">
      <div className="flex items-center gap-2">
        {actionTools.map(({ icon: Icon, action, title, disabled, shortcut }, index) => (
          <React.Fragment key={title}>
            <button
              onClick={action}
              disabled={disabled}
              className={`p-3 rounded-lg transition-all duration-200 flex items-center justify-center group relative ${
                disabled
                  ? 'text-white/30 cursor-not-allowed bg-white/5'
                  : 'text-white/90 hover:bg-white/10 hover:text-white hover:scale-105 active:scale-95'
              }`}
              title={`${title} ${disabled ? '(Not available)' : `(${shortcut})`}`}
            >
              <Icon className="w-5 h-5" />
              
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                {title}
                {!disabled && (
                  <span className="text-white/60 ml-1">({shortcut})</span>
                )}
              </div>
            </button>
            
            {/* Separator */}
            {index < actionTools.length - 1 && (
              <div className="w-px h-6 bg-white/10" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ActionsToolbar;