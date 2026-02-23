/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Stage, Layer, Circle, Group, Path, Rect } from 'react-konva';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings2, 
  Volume2, 
  VolumeX, 
  MousePointer2, 
  Bug, 
  Bird, 
  Target,
  RotateCcw,
  Play,
  Pause
} from 'lucide-react';
import { PreyType, GameState, Prey } from './types';

const PREY_CONFIG = {
  laser: { color: '#ff0000', size: 15, glow: true },
  mouse: { color: '#888888', size: 25, glow: false },
  bird: { color: '#4488ff', size: 30, glow: false },
  bug: { color: '#44ff44', size: 12, glow: false },
};

const THEMES = {
  minimal: { bg: '#09090b', grid: '#18181b' },
  garden: { bg: '#064e3b', grid: '#065f46' },
  night: { bg: '#1e1b4b', grid: '#312e81' },
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    preyType: 'laser',
    speed: 3,
    theme: 'minimal',
    isMuted: false,
  });
  
  const [isPlaying, setIsPlaying] = useState(true);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [prey, setPrey] = useState<Prey>({
    id: 'prey-1',
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    rotation: 0,
    scale: 1,
  });
  
  const [showSettings, setShowSettings] = useState(false);
  const velocityRef = useRef({ dx: 2, dy: 2 });
  const requestRef = useRef<number>(null);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Movement logic
  const animate = useCallback((time: number) => {
    if (!isPlaying) return;

    setPrey(prev => {
      let { x, y, rotation } = prev;
      let { dx, dy } = velocityRef.current;

      // Update position
      x += dx * gameState.speed;
      y += dy * gameState.speed;

      // Bounce off walls
      if (x < 50 || x > dimensions.width - 50) {
        velocityRef.current.dx *= -1;
        rotation = Math.atan2(velocityRef.current.dy, velocityRef.current.dx) * (180 / Math.PI);
      }
      if (y < 50 || y > dimensions.height - 50) {
        velocityRef.current.dy *= -1;
        rotation = Math.atan2(velocityRef.current.dy, velocityRef.current.dx) * (180 / Math.PI);
      }

      // Randomly change direction slightly
      if (Math.random() < 0.02) {
        const angle = (Math.random() - 0.5) * 0.5;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const newDx = dx * cos - dy * sin;
        const newDy = dx * sin + dy * cos;
        velocityRef.current = { dx: newDx, dy: newDy };
        rotation = Math.atan2(newDy, newDx) * (180 / Math.PI);
      }

      return { ...prev, x, y, rotation };
    });

    requestRef.current = requestAnimationFrame(animate);
  }, [isPlaying, dimensions, gameState.speed]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animate]);

  const handlePreyCatch = () => {
    setGameState(prev => ({ ...prev, score: prev.score + 1 }));
    
    // Visual feedback: scale up briefly
    setPrey(prev => ({ ...prev, scale: 1.5 }));
    setTimeout(() => setPrey(prev => ({ ...prev, scale: 1 })), 100);

    // Teleport to random location
    setPrey(prev => ({
      ...prev,
      x: Math.random() * (dimensions.width - 100) + 50,
      y: Math.random() * (dimensions.height - 100) + 50,
    }));

    // Play sound if not muted (using native Audio for simplicity)
    if (!gameState.isMuted) {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      audio.volume = 0.2;
      audio.play().catch(() => {});
    }
  };

  const currentTheme = THEMES[gameState.theme];
  const currentPreyConfig = PREY_CONFIG[gameState.preyType];

  return (
    <div className="relative w-full h-screen overflow-hidden font-sans select-none" style={{ backgroundColor: currentTheme.bg }}>
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" 
           style={{ 
             backgroundImage: `radial-gradient(${currentTheme.grid} 1px, transparent 1px)`,
             backgroundSize: '40px 40px' 
           }} 
      />

      {/* Game Stage */}
      <Stage width={dimensions.width} height={dimensions.height} className="canvas-container">
        <Layer>
          <Group 
            x={prey.x} 
            y={prey.y} 
            rotation={prey.rotation} 
            scaleX={prey.scale} 
            scaleY={prey.scale}
            onClick={handlePreyCatch}
            onTap={handlePreyCatch}
          >
            {gameState.preyType === 'laser' && (
              <>
                <Circle radius={currentPreyConfig.size * 1.5} fill="red" opacity={0.2} />
                <Circle radius={currentPreyConfig.size} fill="red" shadowBlur={15} shadowColor="red" />
                <Circle radius={currentPreyConfig.size * 0.4} fill="white" />
              </>
            )}
            
            {gameState.preyType === 'mouse' && (
              <Group offsetX={currentPreyConfig.size} offsetY={currentPreyConfig.size / 2}>
                {/* Tail */}
                <Path data="M 0 0 Q -20 -10 -40 0" stroke="#666" strokeWidth={2} />
                {/* Body */}
                <Rect width={currentPreyConfig.size * 1.5} height={currentPreyConfig.size} fill="#888" cornerRadius={10} />
                {/* Ears */}
                <Circle x={currentPreyConfig.size * 1.2} y={0} radius={6} fill="#777" />
                <Circle x={currentPreyConfig.size * 1.2} y={currentPreyConfig.size} radius={6} fill="#777" />
                {/* Eyes */}
                <Circle x={currentPreyConfig.size * 1.3} y={currentPreyConfig.size * 0.3} radius={2} fill="black" />
                <Circle x={currentPreyConfig.size * 1.3} y={currentPreyConfig.size * 0.7} radius={2} fill="black" />
              </Group>
            )}

            {gameState.preyType === 'bug' && (
              <Group offsetX={currentPreyConfig.size} offsetY={currentPreyConfig.size}>
                <Circle radius={currentPreyConfig.size} fill="#22c55e" />
                <Rect x={-currentPreyConfig.size} y={-2} width={currentPreyConfig.size * 2} height={4} fill="#166534" />
                <Path data="M -10 -10 L 10 10 M -10 10 L 10 -10" stroke="#166534" strokeWidth={1} />
              </Group>
            )}

            {gameState.preyType === 'bird' && (
              <Group offsetX={currentPreyConfig.size} offsetY={currentPreyConfig.size}>
                <Path data="M 0 0 L 20 -10 L 40 0 L 20 10 Z" fill="#3b82f6" />
                <Path data="M 10 -15 L 20 0 L 10 15" stroke="#2563eb" strokeWidth={2} />
                <Circle x={35} y={0} radius={4} fill="#1d4ed8" />
              </Group>
            )}
          </Group>
        </Layer>
      </Stage>

      {/* HUD */}
      <div className="absolute top-6 left-6 flex items-center gap-4 pointer-events-none">
        <div className="bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-3">
          <Target className="w-5 h-5 text-emerald-400" />
          <span className="font-display text-2xl font-medium tracking-tight">{gameState.score}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute top-6 right-6 flex items-center gap-3">
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full transition-all active:scale-95 border border-white/10"
        >
          {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
        </button>
        
        <button 
          onClick={() => setGameState(prev => ({ ...prev, isMuted: !prev.isMuted }))}
          className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full transition-all active:scale-95 border border-white/10"
        >
          {gameState.isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
        </button>

        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full transition-all active:scale-95 border border-white/10"
        >
          <Settings2 className="w-6 h-6" />
        </button>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-xl font-medium">Play Settings</h2>
              <button 
                onClick={() => setGameState(prev => ({ ...prev, score: 0 }))}
                className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Reset Score
              </button>
            </div>

            <div className="space-y-6">
              {/* Prey Selection */}
              <div>
                <label className="text-xs uppercase tracking-widest font-semibold text-zinc-500 mb-3 block">Prey Type</label>
                <div className="grid grid-cols-4 gap-3">
                  {(['laser', 'mouse', 'bird', 'bug'] as PreyType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setGameState(prev => ({ ...prev, preyType: type }))}
                      className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${
                        gameState.preyType === type 
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                          : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                      }`}
                    >
                      {type === 'laser' && <Target className="w-5 h-5" />}
                      {type === 'mouse' && <MousePointer2 className="w-5 h-5" />}
                      {type === 'bird' && <Bird className="w-5 h-5" />}
                      {type === 'bug' && <Bug className="w-5 h-5" />}
                      <span className="text-[10px] capitalize font-medium">{type}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Speed Slider */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-xs uppercase tracking-widest font-semibold text-zinc-500 block">Movement Speed</label>
                  <span className="text-xs font-mono text-emerald-400">{gameState.speed}x</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  step="0.5"
                  value={gameState.speed}
                  onChange={(e) => setGameState(prev => ({ ...prev, speed: parseFloat(e.target.value) }))}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Theme Selection */}
              <div>
                <label className="text-xs uppercase tracking-widest font-semibold text-zinc-500 mb-3 block">Environment</label>
                <div className="flex gap-3">
                  {(['minimal', 'garden', 'night'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setGameState(prev => ({ ...prev, theme: t }))}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium capitalize transition-all border ${
                        gameState.theme === t 
                          ? 'bg-white text-zinc-950 border-white' 
                          : 'bg-transparent text-zinc-400 border-white/10 hover:border-white/20'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions Overlay */}
      <AnimatePresence>
        {gameState.score === 0 && !showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-10"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <h1 className="font-display text-4xl md:text-6xl font-medium mb-4 text-white/40">Cat Play Zone</h1>
              <p className="text-white/20 text-lg max-w-sm">
                Place this screen on the floor for your cat to play. Tap the prey to score!
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
