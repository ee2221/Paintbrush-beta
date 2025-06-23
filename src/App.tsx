import React from 'react';
import Scene from './components/Scene';
import Toolbar from './components/Toolbar';
import ActionsToolbar from './components/ActionsToolbar';
import LayersPanel from './components/LayersPanel';
import ObjectProperties from './components/ObjectProperties';
import EditControls from './components/EditControls';
import CameraPerspectivePanel from './components/CameraPerspectivePanel';
import PaintControls from './components/PaintControls';

function App() {
  return (
    <div className="w-full h-screen relative">
      <Scene />
      <ActionsToolbar />
      <Toolbar />
      <LayersPanel />
      <ObjectProperties />
      <EditControls />
      <CameraPerspectivePanel />
      <PaintControls />
    </div>
  );
}

export default App;