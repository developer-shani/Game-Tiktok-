export interface Ball {
  id: string;
  name: string;
  color: string;
  glowColor: string;
  secondaryColor: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  speed: number;
  alive: boolean;
  anchors: RayAnchor[];
  nextAnchorIndex: number;
  kills: number;
  eliminatedAt?: number;  // timestamp or frame
  eliminatedBy?: string;  // killer name
}

export interface RayAnchor {
  x: number;
  y: number;
  active: boolean;
  moved?: boolean;
  id: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  type: 'spark' | 'ring' | 'smoke' | 'debris';
}

export interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
}

export interface KillEvent {
  id: string;
  victimName: string;
  victimColor: string;
  killerName: string;
  killerColor: string;
  timestamp: string;
  timeSurvived: number;
}

export interface SimulationConfig {
  headerText: string;
  speed: number;
  bounciness: number;
  gravity: number;
  ballRadius: number;
  competitors: number;
  players: PlayerConfig[];

  // Internal/Laser config preserved
  rayCount: number;
  arcSpanDeg: number;
  glowIntensity: number;
  soundEnabled: boolean;
  autoRestart: boolean;
  autoRestartDelaySec: number;
  speedMultiplier: number;
}

export interface PlayerConfig {
  name: string;
  color: string;
}

export interface WinnerStats {
  color: string;
  name: string;
  wins: number;
}
