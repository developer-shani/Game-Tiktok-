'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, Settings, X } from 'lucide-react';
import { Ball, Particle, Shockwave, SimulationConfig, PlayerConfig } from '@/lib/types';
import {
  BALL_PRESETS,
  
  initializeBalls,
  stepSimulation,
  createEliminationParticles,
  createBounceSparks,
} from '@/lib/physics';
import { soundEngine } from '@/lib/audio';

const DEFAULT_CONFIG: SimulationConfig = {
  headerText: "DAY 7 UNTIL PINK WINS",
  speed: 300,
  bounciness: 1.0,
  gravity: 0,
  ballRadius: 15,
  competitors: 4,
  players: [
    { name: "Player 1", color: "#FF1493" },
    { name: "Player 2", color: "#00E676" },
    { name: "Player 3", color: "#00E5FF" },
    { name: "Player 4", color: "#FF9100" },
    { name: "Player 5", color: "#D500F9" },
    { name: "Player 6", color: "#FFD600" },
    { name: "Player 7", color: "#FF1744" },
    { name: "Player 8", color: "#00F5D4" },
  ],
  rayCount: 150,
  arcSpanDeg: 60,
  glowIntensity: 1.0,
  soundEnabled: true,
  autoRestart: true,
  autoRestartDelaySec: 3,
  speedMultiplier: 1.0,
};

export default function LaserBattleRoyale() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const ballsRef = useRef<Ball[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const shockwavesRef = useRef<Shockwave[]>([]);
  
  const isRunningRef = useRef<boolean>(true);
  const configRef = useRef<SimulationConfig>(DEFAULT_CONFIG);
  const arenaCenterRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const arenaRadiusRef = useRef<number>(100);
  const isRoundOverRef = useRef<boolean>(false);

  const [config, setConfig] = useState<SimulationConfig>(DEFAULT_CONFIG);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Apply config updates immediately to ref so render loop catches it
  const updateConfig = (newConfig: Partial<SimulationConfig>) => {
    setConfig(prev => {
      const merged = { ...prev, ...newConfig };
      configRef.current = merged;
      return merged;
    });
  };

  const startNewRound = useCallback((currentConfig: SimulationConfig = configRef.current) => {
    const center = arenaCenterRef.current;
    const radius = arenaRadiusRef.current;
    
    ballsRef.current = initializeBalls(center, radius, currentConfig);
    particlesRef.current = [];
    shockwavesRef.current = [];
    
    isRoundOverRef.current = false;
    isRunningRef.current = true;
    setIsPlaying(true);
  }, []);

  // Window Resize & Canvas Setup
  const updateCanvasDimensions = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const minDim = Math.min(rect.width, rect.height);
    arenaRadiusRef.current = (minDim / 2) * 0.85; // 85% of half the smallest dimension
    arenaCenterRef.current = { x: rect.width / 2, y: rect.height / 2 };
  }, []);

  useEffect(() => {
    updateCanvasDimensions();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    startNewRound(DEFAULT_CONFIG);

    const handleResize = () => {
      updateCanvasDimensions();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateCanvasDimensions, startNewRound]);

  // Render / Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();
    let accumulator = 0;
    const PHYSICS_FPS = 200;
    const fixedDt = 1 / PHYSICS_FPS;

    let animationId: number;

    const renderLoop = (time: number) => {
      animationId = requestAnimationFrame(renderLoop);
      
      const frameTime = (time - lastTime) / 1000;
      lastTime = time;
      
      // Prevent death spiral if tab is backgrounded
      const dt = Math.min(frameTime, 0.1);
      
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      const center = arenaCenterRef.current;
      const radius = arenaRadiusRef.current;
      const currentConfig = configRef.current;

      // Fixed Timestep Physics Update
      if (isRunningRef.current) {
        accumulator += dt;
        while (accumulator >= fixedDt) {
          const stepResult = stepSimulation(
            ballsRef.current,
            center,
            radius,
            fixedDt,
            currentConfig
          );

          if (currentConfig.soundEnabled) {
            if (stepResult.bounces.length > 0) {
              soundEngine.playBounce();
              stepResult.bounces.forEach((b) => {
                particlesRef.current.push(...createBounceSparks(b.x, b.y, b.normalX, b.normalY, b.ball.color));
              });
            }

            if (stepResult.lineDestructions && stepResult.lineDestructions.length > 0) {
              for (const dest of stepResult.lineDestructions) {
                soundEngine.playLineCut();
                particlesRef.current.push(...createBounceSparks(
                  dest.x, dest.y,
                  Math.random() - 0.5, Math.random() - 0.5,
                  dest.owner.color
                ));
              }
            }

            if (stepResult.eliminated.length > 0) {
              soundEngine.playElimination();
              stepResult.eliminated.forEach((elim) => {
                const { particles, shockwave } = createEliminationParticles(
                  elim.victim.x,
                  elim.victim.y,
                  elim.victim.color,
                  elim.victim.secondaryColor
                );
                particlesRef.current.push(...particles);
                shockwavesRef.current.push(shockwave);
              });
            }
          }

          // Check Win Condition
          const aliveBalls = ballsRef.current.filter((b) => b.alive);
          if (aliveBalls.length <= 1 && !isRoundOverRef.current) {
            isRoundOverRef.current = true;
            if (currentConfig.autoRestart) {
              setTimeout(() => {
                startNewRound(configRef.current);
              }, currentConfig.autoRestartDelaySec * 1000);
            }
          }

          accumulator -= fixedDt;
        }
      }

      // ---------------- RENDER ----------------
      ctx.save();
      ctx.scale(dpr, dpr);

      // Draw Background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // Draw Arena Rim
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw Balls & Strings
      const balls = ballsRef.current;
      for (const ball of balls) {
        if (!ball.alive) continue;

        ctx.save();
        for (let i = 0; i < ball.anchors.length; i++) {
          const anchor = ball.anchors[i];
          if (!anchor.active) continue;
          
          // Draw Line
          ctx.beginPath();
          ctx.moveTo(ball.x, ball.y);
          ctx.lineTo(anchor.x, anchor.y);
          ctx.strokeStyle = ball.color;
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.6;
          ctx.stroke();
          
          ctx.beginPath();
          ctx.moveTo(ball.x, ball.y);
          ctx.lineTo(anchor.x, anchor.y);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.9;
          ctx.stroke();
          
          // Draw Anchor Point on boundary
          ctx.beginPath();
          ctx.arc(anchor.x, anchor.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = ball.color;
          ctx.globalAlpha = 1.0;
          ctx.fill();
        }
        ctx.restore();

        // Draw Ball
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = ball.color;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx * 60 * dt; // assuming dt ~1/60 for particle physics scaling
        p.y += p.vy * 60 * dt;
        p.life -= 1 * 60 * dt;

        if (p.life <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // Shockwaves
      for (let i = shockwavesRef.current.length - 1; i >= 0; i--) {
        const sw = shockwavesRef.current[i];
        sw.radius += 200 * dt;
        sw.alpha = Math.max(0, 1 - sw.radius / sw.maxRadius);

        if (sw.alpha <= 0) {
          shockwavesRef.current.splice(i, 1);
          continue;
        }

        ctx.globalAlpha = sw.alpha;
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1.0;

      ctx.restore();
    };

    animationId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animationId);
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-screen h-screen bg-black overflow-hidden font-sans select-none"
    >
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />

      {/* Header Overlay */}
      <div className="absolute top-10 left-0 w-full z-10 flex justify-center pointer-events-none">
        <h1 
          className="text-4xl md:text-5xl font-black text-white text-center tracking-tighter"
          style={{ textShadow: '0 0 10px rgba(255,255,255,0.8), 0 0 20px rgba(255,255,255,0.4)' }}
        >
          {config.headerText}
        </h1>
      </div>

      {/* Settings Button */}
      <button 
        className="absolute top-4 left-4 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm"
        onClick={() => setShowSettings(true)}
      >
        <Settings className="w-6 h-6 text-white" />
      </button>

      {/* Settings Modal */}
      {showSettings && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111111] border border-gray-800 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
            <div className="sticky top-0 bg-[#111111] p-4 border-b border-gray-800 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold text-white">Game Settings</h2>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-6">
              {/* Header Text */}
              <div className="space-y-2">
                <label className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Header Text</label>
                <input 
                  type="text" 
                  value={config.headerText}
                  onChange={(e) => updateConfig({ headerText: e.target.value })}
                  className="w-full bg-[#222] text-white rounded p-2 text-sm border border-gray-700 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Sliders */}
              {[
                { label: 'Speed', key: 'speed', min: 10, max: 1000, step: 10 },
                { label: 'Bounciness', key: 'bounciness', min: 0.0, max: 2.0, step: 0.1 },
                { label: 'Gravity', key: 'gravity', min: 0, max: 2000, step: 50 },
                { label: 'Ball Size', key: 'ballRadius', min: 5, max: 50, step: 1 },
                { label: 'Competitors', key: 'competitors', min: 2, max: 8, step: 1 }
              ].map((setting) => (
                <div key={setting.key} className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-400 uppercase font-semibold tracking-wider">
                    <label>{setting.label}</label>
                    <span>{config[setting.key as keyof SimulationConfig] as number}</span>
                  </div>
                  <input 
                    type="range"
                    min={setting.min}
                    max={setting.max}
                    step={setting.step}
                    value={config[setting.key as keyof SimulationConfig] as number}
                    onChange={(e) => updateConfig({ [setting.key]: parseFloat(e.target.value) })}
                    className="w-full accent-blue-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              ))}

              {/* Player Configs */}
              <div className="space-y-3 pt-2">
                {config.players.slice(0, config.competitors).map((player, idx) => (
                  <div key={idx} className="bg-[#1a1a1a] rounded p-3 border-l-4" style={{ borderColor: player.color }}>
                    <div className="text-xs text-gray-400 uppercase font-semibold mb-2">Player {idx + 1}</div>
                    <div className="flex gap-3 items-center">
                      <input 
                        type="color" 
                        value={player.color}
                        onChange={(e) => {
                          const newPlayers = [...config.players];
                          newPlayers[idx] = { ...newPlayers[idx], color: e.target.value };
                          updateConfig({ players: newPlayers });
                        }}
                        className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
                      />
                      <input 
                        type="text" 
                        value={player.name}
                        onChange={(e) => {
                          const newPlayers = [...config.players];
                          newPlayers[idx] = { ...newPlayers[idx], name: e.target.value };
                          updateConfig({ players: newPlayers });
                        }}
                        className="flex-1 bg-[#2a2a2a] text-white rounded p-1.5 text-sm border border-gray-700 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-gray-800 grid grid-cols-2 gap-3 sticky bottom-0 bg-[#111111] z-10">
              <button 
                onClick={() => {
                  startNewRound(config);
                  setShowSettings(false);
                }}
                className="py-2 bg-emerald-400 hover:bg-emerald-500 text-black font-bold rounded"
              >
                Start
              </button>
              <button 
                onClick={() => {
                  setIsPlaying(!isPlaying);
                  isRunningRef.current = !isPlaying;
                }}
                className="py-2 bg-white hover:bg-gray-200 text-black font-bold rounded flex justify-center items-center gap-2"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <button 
                onClick={() => {
                  startNewRound(config);
                }}
                className="py-2 bg-white hover:bg-gray-200 text-black font-bold rounded"
              >
                Reset
              </button>
              <button 
                onClick={toggleFullscreen}
                className="py-2 bg-white hover:bg-gray-200 text-black font-bold rounded"
              >
                Fullscreen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
