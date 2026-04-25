import React, { Suspense, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  OrbitControls, PerspectiveCamera, Environment, Grid,
  ContactShadows, Text, Html, Center, Stars,
} from '@react-three/drei';
import { Box } from 'lucide-react';
import * as THREE from 'three';

// ─── Error Boundary ─────────────────────────────────────────────────────────
class ThreeErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[600px] bg-zinc-950 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-4 text-center p-10">
          <Box size={48} className="text-white/10" />
          <p className="text-white/40 text-sm font-mono">3D renderer encountered an error.</p>
          <p className="text-white/20 text-xs font-mono max-w-sm">{this.state.error}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: '' })}
            className="mt-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white/40 text-xs hover:bg-white/10 transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Hardware Component ───────────────────────────────────────────────────────
interface HardwareComponentProps {
  name: string;
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  specs?: string;
}

const HardwareComponent = ({ name, position, size, color, specs }: HardwareComponentProps) => {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={position}>
      <mesh
        castShadow
        receiveShadow
        scale={hovered ? 1.05 : 1}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={color}
          metalness={hovered ? 0.4 : 0.8}
          roughness={hovered ? 0.1 : 0.2}
          emissive={color}
          emissiveIntensity={hovered ? 1.2 : 0.2}
        />
      </mesh>

      {/* Label – use explicit hex, not Tailwind opacity syntax */}
      <Text
        position={[0, size[1] / 2 + 0.8, 0]}
        fontSize={0.25}
        color={hovered ? '#ffffff' : '#888888'}
        anchorX="center"
        anchorY="middle"
        font="https://fonts.gstatic.com/s/jetbrainsmono/v18/t642PrMg_U_-SNoB_Nq30f06.woff"
      >
        {name}
      </Text>

      {/* Tooltip */}
      {hovered && (
        <Html
          distanceFactor={10}
          position={[0, size[1] / 2 + 1.5, 0]}
          zIndexRange={[100, 0]}
        >
          <div className="bg-black/95 backdrop-blur-2xl border border-white/20 p-5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] min-w-[280px] pointer-events-none transform -translate-y-full -translate-x-1/2 z-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full animate-pulse"
                  style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}66` }}
                />
                <span className="text-white font-bold text-sm tracking-tight">{name}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-green-500/20 border border-green-500/30 px-2.5 py-0.5 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-[9px] text-green-400 font-bold uppercase tracking-widest">Active</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <p className="text-white/30 text-[9px] uppercase tracking-[0.2em] font-bold">Hardware Specifications</p>
                <div className="bg-white/5 border border-white/5 rounded-lg p-3">
                  <p className="text-white/90 text-xs leading-relaxed font-mono">
                    {specs || 'Standard Integrated Hardware Interface Controller'}
                  </p>
                </div>
              </div>
              <div className="flex gap-4 pt-2 border-t border-white/5">
                <div className="flex-1 space-y-1">
                  <p className="text-white/20 text-[8px] uppercase tracking-widest">Connection</p>
                  <p className="text-white/60 text-[10px] font-bold">GPIO / Digital</p>
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-white/20 text-[8px] uppercase tracking-widest">Voltage</p>
                  <p className="text-white/60 text-[10px] font-bold">3.3V – 5V</p>
                </div>
              </div>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

// ─── Wire Segment ─────────────────────────────────────────────────────────────
// Fix: Compute orientation via quaternion during render instead of useLayoutEffect+lookAt.
// lookAt() is unreliable before the mesh's world matrix is initialised in the scene.
const WireSegment = ({
  start,
  end,
  color,
}: {
  start: [number, number, number];
  end: [number, number, number];
  color: string;
}) => {
  const { midPoint, length, quaternion } = useMemo(() => {
    const s = new THREE.Vector3(...start);
    const e = new THREE.Vector3(...end);
    const mid: [number, number, number] = [
      (start[0] + end[0]) / 2,
      (start[1] + end[1]) / 2,
      (start[2] + end[2]) / 2,
    ];
    const len = s.distanceTo(e);
    const dir = e.clone().sub(s).normalize();

    // Align box's local Z axis with the wire direction
    const q = new THREE.Quaternion();
    // Avoid degenerate case when direction is exactly (0,0,1)
    const zAxis = new THREE.Vector3(0, 0, 1);
    if (Math.abs(dir.dot(zAxis)) > 0.9999) {
      if (dir.z < 0) q.set(0, 1, 0, 0); // 180° around Y
    } else {
      q.setFromUnitVectors(zAxis, dir);
    }
    return { midPoint: mid, length: len, quaternion: q };
  }, [start[0], start[1], start[2], end[0], end[1], end[2]]);

  if (length < 0.001) return null;

  return (
    <mesh position={midPoint} quaternion={quaternion}>
      <boxGeometry args={[0.08, 0.08, length]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
    </mesh>
  );
};

// ─── Wire (multi-segment) ────────────────────────────────────────────────────
interface WireProps {
  points: [number, number, number][];
  color: string;
}

const Wire = ({ points, color }: WireProps) => (
  <group>
    {points.map((point, i) => {
      if (i === points.length - 1) return null;
      return (
        <WireSegment key={i} start={point} end={points[i + 1]} color={color} />
      );
    })}
  </group>
);

// ─── Main Viewer ──────────────────────────────────────────────────────────────
interface Placement {
  name: string;
  position: number[];
  size: number[];
  color: string;
  type?: 'component' | 'wire';
  points?: (number[] | { x: number; y: number; z: number })[];
  specs?: string;
}

interface ThreeDViewerProps {
  layout: {
    housing?: { dimensions: number[] };
    placements: Placement[];
  };
  visiblePercentage?: number;
}

const ThreeDViewerInner = ({ layout, visiblePercentage = 100 }: ThreeDViewerProps) => {
  const SCALE = 0.1;
  const housingDim = layout.housing?.dimensions?.map((d) => d * SCALE) ?? [12, 1, 10];

  const placementsToRender = useMemo(() => {
    const all = layout.placements ?? [];
    if (typeof visiblePercentage !== 'number' || visiblePercentage >= 100) return all;
    return all.slice(0, Math.max(1, Math.ceil((visiblePercentage / 100) * all.length)));
  }, [layout.placements, visiblePercentage]);

  return (
    <div className="w-full h-full min-h-[600px] bg-zinc-950 rounded-2xl overflow-hidden relative border border-white/5">
      {/* Header */}
      <div className="absolute top-6 left-6 z-10">
        <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.4em]">Interactive 3D Engine</h4>
        <p className="text-white/80 text-xs font-mono mt-1">Live Hardware Visualization</p>
      </div>

      <Canvas shadows gl={{ antialias: true }} className="cursor-move">
        <Suspense
          fallback={
            <Html center>
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-white/30 border-t-transparent rounded-full animate-spin" />
                <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-[10px]">
                  Initializing Engine…
                </p>
              </div>
            </Html>
          }
        >
          <PerspectiveCamera makeDefault position={[12, 12, 12]} fov={40} />
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            maxPolarAngle={Math.PI / 2}
            minDistance={8}
            maxDistance={50}
            makeDefault
          />

          <ambientLight intensity={0.7} />
          <spotLight position={[20, 20, 20]} angle={0.15} penumbra={1} intensity={3} castShadow />
          <pointLight position={[-10, 10, -10]} intensity={1.5} color="#4f46e5" />
          <Environment preset="night" />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

          <Center top>
            <group scale={1.5}>
              {/* Base PCB plate */}
              <mesh position={[0, -0.15, 0]} receiveShadow>
                <boxGeometry args={[housingDim[0], 0.1, housingDim[2] ?? 10]} />
                <meshStandardMaterial color="#020617" metalness={0.9} roughness={0.1} />
              </mesh>

              <group>
                {placementsToRender.map((item, idx) => {
                  if (item.type === 'wire' && item.points && item.points.length >= 2) {
                    const wirePoints = item.points.map((p): [number, number, number] => {
                      if (Array.isArray(p)) {
                        return [(p[0] ?? 0) * SCALE, (p[1] ?? 0) * SCALE, (p[2] ?? 0) * SCALE];
                      }
                      return [(p.x ?? 0) * SCALE, (p.y ?? 0) * SCALE, (p.z ?? 0) * SCALE];
                    });
                    return (
                      <Wire key={idx} points={wirePoints} color={item.color || '#ffffff'} />
                    );
                  }

                  const pos = item.position ?? [0, 0, 0];
                  const sz = item.size ?? [10, 10, 10];
                  return (
                    <HardwareComponent
                      key={idx}
                      name={item.name || 'Component'}
                      position={[
                        (pos[0] ?? 0) * SCALE,
                        ((pos[1] ?? 0) * SCALE) + ((sz[1] ?? 10) * SCALE / 2),
                        (pos[2] ?? 0) * SCALE,
                      ]}
                      size={[sz[0] * SCALE, sz[1] * SCALE, sz[2] * SCALE] as [number, number, number]}
                      color={item.color || '#3b82f6'}
                      specs={item.specs}
                    />
                  );
                })}
              </group>
            </group>
          </Center>

          <Grid
            infiniteGrid
            fadeDistance={100}
            fadeStrength={5}
            cellSize={2}
            sectionSize={10}
            sectionColor="#4f46e5"
            sectionThickness={1}
            cellColor="#1e1b4b"
          />
          <ContactShadows position={[0, -0.05, 0]} opacity={0.4} scale={20} blur={2} far={4.5} />
        </Suspense>
      </Canvas>

      {/* Hardware Inventory Overlay */}
      <div className="absolute top-24 left-6 z-10 w-64 space-y-4">
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-2xl">
          <h5 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] mb-4">
            Hardware Inventory
          </h5>
          <div className="space-y-3">
            {(layout?.placements ?? [])
              .filter((p) => p.type !== 'wire')
              .map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-[11px] text-white/70 font-mono tracking-tight truncate">
                    {p.name}
                  </span>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-xl flex items-center gap-3">
          <Box size={14} className="text-white/60" />
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.1em]">3D Preview Active</span>
        </div>
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-6 right-6 z-10">
        <div className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
            Controls: Orbit &amp; Zoom
          </span>
        </div>
      </div>
    </div>
  );
};

const ThreeDViewer = (props: ThreeDViewerProps) => (
  <ThreeErrorBoundary>
    <ThreeDViewerInner {...props} />
  </ThreeErrorBoundary>
);

export default ThreeDViewer;
