import React, { useState, useEffect } from 'react';
import { useSceneStore } from '../store/sceneStore';
import { X, Lock } from 'lucide-react';
import * as THREE from 'three';

const ObjectProperties: React.FC = () => {
  const { selectedObject, updateObjectProperties, updateObjectColor, updateObjectOpacity, isObjectLocked } = useSceneStore();
  const [localOpacity, setLocalOpacity] = useState(1);

  const getMaterial = () => {
    if (selectedObject instanceof THREE.Mesh) {
      return selectedObject.material as THREE.MeshStandardMaterial;
    }
    return null;
  };

  const material = getMaterial();
  const currentColor = material ? '#' + material.color.getHexString() : '#44aa88';

  // Check if selected object is locked
  const selectedObj = useSceneStore.getState().objects.find(obj => obj.object === selectedObject);
  const objectLocked = selectedObj ? isObjectLocked(selectedObj.id) : false;

  useEffect(() => {
    if (material) {
      setLocalOpacity(material.opacity);
    }
  }, [selectedObject, material]);

  if (!selectedObject) return null;

  const handlePositionChange = (axis: 'x' | 'y' | 'z', value: number) => {
    if (objectLocked) return;
    selectedObject.position[axis] = value;
    updateObjectProperties();
  };

  const handleRotationChange = (axis: 'x' | 'y' | 'z', value: number) => {
    if (objectLocked) return;
    selectedObject.rotation[axis] = (value * Math.PI) / 180;
    updateObjectProperties();
  };

  const handleScaleChange = (axis: 'x' | 'y' | 'z', value: number) => {
    if (objectLocked) return;
    selectedObject.scale[axis] = value;
    updateObjectProperties();
  };

  const handleOpacityChange = (value: number) => {
    if (objectLocked) return;
    setLocalOpacity(value);
    updateObjectOpacity(value);
  };

  const handleColorChange = (color: string) => {
    if (objectLocked) return;
    updateObjectColor(color);
  };

  return (
    <div className="absolute right-72 top-4 bg-[#1a1a1a] rounded-xl shadow-2xl shadow-black/20 p-4 w-64 border border-white/5">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-white/90">Properties</h2>
          {objectLocked && <Lock className="w-4 h-4 text-orange-400" />}
        </div>
        <button
          onClick={() => useSceneStore.getState().setSelectedObject(null)}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/70"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {objectLocked && (
        <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
          <p className="text-sm text-orange-400 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Object is locked
          </p>
          <p className="text-xs text-white/50 mt-1">
            Unlock to modify properties
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h3 className="font-medium mb-2 text-white/70 text-sm">Position</h3>
          <div className="grid grid-cols-3 gap-2">
            {(['x', 'y', 'z'] as const).map((axis) => (
              <div key={`pos-${axis}`}>
                <label className="text-xs text-white/50 uppercase block mb-1">{axis}</label>
                <input
                  type="number"
                  value={selectedObject.position[axis]}
                  onChange={(e) => handlePositionChange(axis, parseFloat(e.target.value))}
                  step="0.1"
                  disabled={objectLocked}
                  className={`w-full border rounded px-2 py-1 text-sm focus:outline-none ${
                    objectLocked 
                      ? 'bg-[#1a1a1a] border-white/5 text-white/30 cursor-not-allowed'
                      : 'bg-[#2a2a2a] border-white/10 text-white/90 focus:border-blue-500/50'
                  }`}
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-2 text-white/70 text-sm">Rotation (degrees)</h3>
          <div className="grid grid-cols-3 gap-2">
            {(['x', 'y', 'z'] as const).map((axis) => (
              <div key={`rot-${axis}`}>
                <label className="text-xs text-white/50 uppercase block mb-1">{axis}</label>
                <input
                  type="number"
                  value={(selectedObject.rotation[axis] * 180) / Math.PI}
                  onChange={(e) => handleRotationChange(axis, parseFloat(e.target.value))}
                  step="5"
                  disabled={objectLocked}
                  className={`w-full border rounded px-2 py-1 text-sm focus:outline-none ${
                    objectLocked 
                      ? 'bg-[#1a1a1a] border-white/5 text-white/30 cursor-not-allowed'
                      : 'bg-[#2a2a2a] border-white/10 text-white/90 focus:border-blue-500/50'
                  }`}
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-2 text-white/70 text-sm">Scale</h3>
          <div className="grid grid-cols-3 gap-2">
            {(['x', 'y', 'z'] as const).map((axis) => (
              <div key={`scale-${axis}`}>
                <label className="text-xs text-white/50 uppercase block mb-1">{axis}</label>
                <input
                  type="number"
                  value={selectedObject.scale[axis]}
                  onChange={(e) => handleScaleChange(axis, parseFloat(e.target.value))}
                  step="0.1"
                  min="0.1"
                  disabled={objectLocked}
                  className={`w-full border rounded px-2 py-1 text-sm focus:outline-none ${
                    objectLocked 
                      ? 'bg-[#1a1a1a] border-white/5 text-white/30 cursor-not-allowed'
                      : 'bg-[#2a2a2a] border-white/10 text-white/90 focus:border-blue-500/50'
                  }`}
                />
              </div>
            ))}
          </div>
        </div>

        {material && (
          <>
            <div>
              <h3 className="font-medium mb-2 text-white/70 text-sm">Color</h3>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={currentColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  disabled={objectLocked}
                  className={`w-12 h-8 rounded cursor-pointer border ${
                    objectLocked 
                      ? 'bg-[#1a1a1a] border-white/5 cursor-not-allowed opacity-50'
                      : 'bg-[#2a2a2a] border-white/10'
                  }`}
                />
                <input
                  type="text"
                  value={currentColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  disabled={objectLocked}
                  className={`flex-1 border rounded px-2 py-1 text-sm focus:outline-none ${
                    objectLocked 
                      ? 'bg-[#1a1a1a] border-white/5 text-white/30 cursor-not-allowed'
                      : 'bg-[#2a2a2a] border-white/10 text-white/90 focus:border-blue-500/50'
                  }`}
                />
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2 text-white/70 text-sm">Opacity</h3>
              <div className="flex gap-2 items-center">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={localOpacity}
                  onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
                  disabled={objectLocked}
                  className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer ${
                    objectLocked 
                      ? 'bg-[#1a1a1a] cursor-not-allowed opacity-50'
                      : 'bg-[#2a2a2a]'
                  }`}
                />
                <span className={`text-sm w-12 text-right ${
                  objectLocked ? 'text-white/30' : 'text-white/90'
                }`}>
                  {Math.round(localOpacity * 100)}%
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ObjectProperties;