import React, { useState, useEffect } from 'react';
import { Paintbrush, Palette, Droplets, Brush, SprayCan as Spray, Circle, Square, Triangle, Minus, Plus, RotateCcw, Eye, EyeOff, Settings, X } from 'lucide-react';
import { useSceneStore } from '../store/sceneStore';

const PaintControls: React.FC = () => {
  const { 
    paintMode, 
    paintSettings, 
    updatePaintSettings, 
    selectedObject,
    isObjectLocked 
  } = useSceneStore();

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [colorHistory, setColorHistory] = useState<string[]>(['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff']);

  // Check if selected object is locked
  const selectedObj = useSceneStore.getState().objects.find(obj => obj.object === selectedObject);
  const objectLocked = selectedObj ? isObjectLocked(selectedObj.id) : false;

  if (!paintMode) return null;

  const brushTypes = [
    { id: 'round', name: 'Round', icon: Circle, description: 'Standard round brush' },
    { id: 'square', name: 'Square', icon: Square, description: 'Square brush for sharp edges' },
    { id: 'airbrush', name: 'Airbrush', icon: Spray, description: 'Soft airbrush with falloff' },
    { id: 'stipple', name: 'Stipple', icon: Droplets, description: 'Textured stipple effect' },
    { id: 'gradient', name: 'Gradient', icon: Triangle, description: 'Gradient brush' }
  ];

  const blendModes = [
    { id: 'normal', name: 'Normal' },
    { id: 'multiply', name: 'Multiply' },
    { id: 'screen', name: 'Screen' },
    { id: 'overlay', name: 'Overlay' },
    { id: 'soft-light', name: 'Soft Light' },
    { id: 'hard-light', name: 'Hard Light' },
    { id: 'color-dodge', name: 'Color Dodge' },
    { id: 'color-burn', name: 'Color Burn' }
  ];

  const presetColors = [
    '#ff0000', '#ff4500', '#ffa500', '#ffff00', '#9acd32', '#00ff00',
    '#00ffff', '#0000ff', '#4169e1', '#8a2be2', '#ff00ff', '#ff1493',
    '#ffffff', '#c0c0c0', '#808080', '#404040', '#000000', '#8b4513'
  ];

  const addToColorHistory = (color: string) => {
    setColorHistory(prev => {
      const filtered = prev.filter(c => c !== color);
      return [color, ...filtered].slice(0, 12);
    });
  };

  const handleColorChange = (color: string) => {
    updatePaintSettings({ primaryColor: color });
    addToColorHistory(color);
  };

  const handleSecondaryColorChange = (color: string) => {
    updatePaintSettings({ secondaryColor: color });
    addToColorHistory(color);
  };

  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 bg-[#1a1a1a] rounded-xl shadow-2xl shadow-black/20 p-4 w-80 border border-white/5 max-h-[85vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Paintbrush className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white/90">Paint Mode</h2>
        </div>
        <button
          onClick={() => useSceneStore.getState().setPaintMode(false)}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/70"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {objectLocked && (
        <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
          <p className="text-sm text-orange-400 flex items-center gap-2">
            <EyeOff className="w-4 h-4" />
            Object is locked
          </p>
          <p className="text-xs text-white/50 mt-1">
            Unlock to enable painting
          </p>
        </div>
      )}

      {!selectedObject && (
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-sm text-yellow-400">
            Select an object to start painting
          </p>
        </div>
      )}

      <div className="space-y-4">
        {/* Brush Type */}
        <div>
          <h3 className="font-medium mb-2 text-white/70 text-sm">Brush Type</h3>
          <div className="grid grid-cols-2 gap-2">
            {brushTypes.map(({ id, name, icon: Icon, description }) => (
              <button
                key={id}
                onClick={() => updatePaintSettings({ brushType: id as any })}
                disabled={objectLocked || !selectedObject}
                className={`p-3 rounded-lg transition-all duration-200 flex flex-col items-center gap-1 ${
                  objectLocked || !selectedObject
                    ? 'bg-[#2a2a2a] text-white/30 cursor-not-allowed'
                    : paintSettings.brushType === id
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white/90'
                }`}
                title={description}
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs font-medium">{name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Colors */}
        <div>
          <h3 className="font-medium mb-2 text-white/70 text-sm">Colors</h3>
          
          {/* Primary and Secondary Colors */}
          <div className="flex gap-3 mb-3">
            <div className="flex-1">
              <label className="block text-xs text-white/50 mb-1">Primary</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={paintSettings.primaryColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  disabled={objectLocked || !selectedObject}
                  className={`w-12 h-8 rounded cursor-pointer border ${
                    objectLocked || !selectedObject
                      ? 'bg-[#1a1a1a] border-white/5 cursor-not-allowed opacity-50'
                      : 'bg-[#2a2a2a] border-white/10'
                  }`}
                />
                <input
                  type="text"
                  value={paintSettings.primaryColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  disabled={objectLocked || !selectedObject}
                  className={`flex-1 border rounded px-2 py-1 text-sm focus:outline-none ${
                    objectLocked || !selectedObject
                      ? 'bg-[#1a1a1a] border-white/5 text-white/30 cursor-not-allowed'
                      : 'bg-[#2a2a2a] border-white/10 text-white/90 focus:border-blue-500/50'
                  }`}
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-xs text-white/50 mb-1">Secondary</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={paintSettings.secondaryColor}
                  onChange={(e) => handleSecondaryColorChange(e.target.value)}
                  disabled={objectLocked || !selectedObject}
                  className={`w-12 h-8 rounded cursor-pointer border ${
                    objectLocked || !selectedObject
                      ? 'bg-[#1a1a1a] border-white/5 cursor-not-allowed opacity-50'
                      : 'bg-[#2a2a2a] border-white/10'
                  }`}
                />
                <input
                  type="text"
                  value={paintSettings.secondaryColor}
                  onChange={(e) => handleSecondaryColorChange(e.target.value)}
                  disabled={objectLocked || !selectedObject}
                  className={`flex-1 border rounded px-2 py-1 text-sm focus:outline-none ${
                    objectLocked || !selectedObject
                      ? 'bg-[#1a1a1a] border-white/5 text-white/30 cursor-not-allowed'
                      : 'bg-[#2a2a2a] border-white/10 text-white/90 focus:border-blue-500/50'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Color Presets */}
          <div className="grid grid-cols-6 gap-1 mb-3">
            {presetColors.map((color) => (
              <button
                key={color}
                onClick={() => handleColorChange(color)}
                disabled={objectLocked || !selectedObject}
                className={`w-8 h-8 rounded border-2 transition-all ${
                  objectLocked || !selectedObject
                    ? 'cursor-not-allowed opacity-50'
                    : paintSettings.primaryColor === color
                      ? 'border-white scale-110'
                      : 'border-white/20 hover:border-white/50 hover:scale-105'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>

          {/* Color History */}
          {colorHistory.length > 0 && (
            <div>
              <label className="block text-xs text-white/50 mb-1">Recent Colors</label>
              <div className="flex gap-1 flex-wrap">
                {colorHistory.map((color, index) => (
                  <button
                    key={`${color}-${index}`}
                    onClick={() => handleColorChange(color)}
                    disabled={objectLocked || !selectedObject}
                    className={`w-6 h-6 rounded border transition-all ${
                      objectLocked || !selectedObject
                        ? 'cursor-not-allowed opacity-50'
                        : 'border-white/20 hover:border-white/50 hover:scale-110'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Brush Settings */}
        <div>
          <h3 className="font-medium mb-2 text-white/70 text-sm">Brush Settings</h3>
          
          {/* Size */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-white/50">Size</label>
              <span className="text-xs text-white/70">{paintSettings.brushSize}px</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updatePaintSettings({ brushSize: Math.max(1, paintSettings.brushSize - 5) })}
                disabled={objectLocked || !selectedObject}
                className={`p-1 rounded ${
                  objectLocked || !selectedObject
                    ? 'text-white/30 cursor-not-allowed'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <Minus className="w-3 h-3" />
              </button>
              <input
                type="range"
                min="1"
                max="100"
                value={paintSettings.brushSize}
                onChange={(e) => updatePaintSettings({ brushSize: parseInt(e.target.value) })}
                disabled={objectLocked || !selectedObject}
                className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer ${
                  objectLocked || !selectedObject
                    ? 'bg-[#1a1a1a] cursor-not-allowed opacity-50'
                    : 'bg-[#2a2a2a]'
                }`}
              />
              <button
                onClick={() => updatePaintSettings({ brushSize: Math.min(100, paintSettings.brushSize + 5) })}
                disabled={objectLocked || !selectedObject}
                className={`p-1 rounded ${
                  objectLocked || !selectedObject
                    ? 'text-white/30 cursor-not-allowed'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Opacity */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-white/50">Opacity</label>
              <span className="text-xs text-white/70">{Math.round(paintSettings.opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={paintSettings.opacity}
              onChange={(e) => updatePaintSettings({ opacity: parseFloat(e.target.value) })}
              disabled={objectLocked || !selectedObject}
              className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                objectLocked || !selectedObject
                  ? 'bg-[#1a1a1a] cursor-not-allowed opacity-50'
                  : 'bg-[#2a2a2a]'
              }`}
            />
          </div>

          {/* Flow */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-white/50">Flow</label>
              <span className="text-xs text-white/70">{Math.round(paintSettings.flow * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={paintSettings.flow}
              onChange={(e) => updatePaintSettings({ flow: parseFloat(e.target.value) })}
              disabled={objectLocked || !selectedObject}
              className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                objectLocked || !selectedObject
                  ? 'bg-[#1a1a1a] cursor-not-allowed opacity-50'
                  : 'bg-[#2a2a2a]'
              }`}
            />
          </div>

          {/* Hardness (for airbrush) */}
          {paintSettings.brushType === 'airbrush' && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-white/50">Hardness</label>
                <span className="text-xs text-white/70">{Math.round(paintSettings.hardness * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={paintSettings.hardness}
                onChange={(e) => updatePaintSettings({ hardness: parseFloat(e.target.value) })}
                disabled={objectLocked || !selectedObject}
                className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                  objectLocked || !selectedObject
                    ? 'bg-[#1a1a1a] cursor-not-allowed opacity-50'
                    : 'bg-[#2a2a2a]'
                }`}
              />
            </div>
          )}
        </div>

        {/* Advanced Settings */}
        <div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-white/5 transition-colors text-white/70"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium">Advanced Settings</span>
            </div>
            <div className={`transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>
              <Triangle className="w-3 h-3" />
            </div>
          </button>

          {showAdvanced && (
            <div className="mt-3 space-y-3 pl-4 border-l border-white/10">
              {/* Blend Mode */}
              <div>
                <label className="block text-xs text-white/50 mb-1">Blend Mode</label>
                <select
                  value={paintSettings.blendMode}
                  onChange={(e) => updatePaintSettings({ blendMode: e.target.value as any })}
                  disabled={objectLocked || !selectedObject}
                  className={`w-full border rounded px-2 py-1 text-sm focus:outline-none ${
                    objectLocked || !selectedObject
                      ? 'bg-[#1a1a1a] border-white/5 text-white/30 cursor-not-allowed'
                      : 'bg-[#2a2a2a] border-white/10 text-white/90 focus:border-blue-500/50'
                  }`}
                >
                  {blendModes.map(({ id, name }) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
              </div>

              {/* Texture Strength (for stipple) */}
              {paintSettings.brushType === 'stipple' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-white/50">Texture Strength</label>
                    <span className="text-xs text-white/70">{Math.round(paintSettings.textureStrength * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={paintSettings.textureStrength}
                    onChange={(e) => updatePaintSettings({ textureStrength: parseFloat(e.target.value) })}
                    disabled={objectLocked || !selectedObject}
                    className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                      objectLocked || !selectedObject
                        ? 'bg-[#1a1a1a] cursor-not-allowed opacity-50'
                        : 'bg-[#2a2a2a]'
                    }`}
                  />
                </div>
              )}

              {/* Gradient Direction (for gradient brush) */}
              {paintSettings.brushType === 'gradient' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-white/50">Gradient Angle</label>
                    <span className="text-xs text-white/70">{Math.round(paintSettings.gradientAngle)}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={paintSettings.gradientAngle}
                    onChange={(e) => updatePaintSettings({ gradientAngle: parseInt(e.target.value) })}
                    disabled={objectLocked || !selectedObject}
                    className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                      objectLocked || !selectedObject
                        ? 'bg-[#1a1a1a] cursor-not-allowed opacity-50'
                        : 'bg-[#2a2a2a]'
                    }`}
                  />
                </div>
              )}

              {/* Symmetry */}
              <div className="flex items-center justify-between">
                <label className="text-xs text-white/50">Symmetry</label>
                <button
                  onClick={() => updatePaintSettings({ symmetry: !paintSettings.symmetry })}
                  disabled={objectLocked || !selectedObject}
                  className={`p-1 rounded transition-colors ${
                    objectLocked || !selectedObject
                      ? 'text-white/30 cursor-not-allowed'
                      : paintSettings.symmetry
                        ? 'text-blue-400 bg-blue-500/20'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {paintSettings.symmetry ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-white/10">
          <div className="flex gap-2">
            <button
              onClick={() => useSceneStore.getState().clearPaintLayer()}
              disabled={objectLocked || !selectedObject}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                objectLocked || !selectedObject
                  ? 'bg-[#2a2a2a] text-white/30 cursor-not-allowed'
                  : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
              }`}
            >
              <RotateCcw className="w-4 h-4 inline mr-1" />
              Clear Paint
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaintControls;