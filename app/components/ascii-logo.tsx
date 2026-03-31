"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { Canvas, useLoader, useFrame } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { Vector2, Vector3, Box3 } from "three";
import * as THREE from "three";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { AsciiEffect } from "./ascii-effect";

// @react-three/fiber uses THREE.Clock which is deprecated in three.js r168+.
// Suppress the warning until r3f is updated to use THREE.Timer.
if (typeof window !== "undefined") {
  const _warn = console.warn.bind(console);
  console.warn = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("Clock") && args[0].includes("deprecated")) return;
    _warn(...args);
  };
}

const LOGO_COLOR = "#6efe90";

function LogoMesh() {
  const svgData = useLoader(SVGLoader, "/AuditIA.svg");
  const groupRef = useRef<THREE.Group>(null);
  const rotationRef = useRef<THREE.Group>(null);

  useFrame((_state, delta) => {
    if (rotationRef.current) {
      rotationRef.current.rotation.y += delta * 1.5;
    }
  });

  const shapes = svgData.paths.flatMap((path, pi) =>
    SVGLoader.createShapes(path).map((shape, si) => ({
      shape,
      key: `${pi}-${si}`,
    })),
  );

  useEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    const id = window.setTimeout(() => {
      if (!groupRef.current) return;
      const box = new Box3().setFromObject(groupRef.current);
      const center = new Vector3();
      box.getCenter(center);
      groupRef.current.position.set(-center.x, -center.y, -center.z);
    }, 50);
    return () => window.clearTimeout(id);
  }, [svgData]);

  return (
    <group ref={rotationRef}>
      <group ref={groupRef} scale={0.02}>
        <group scale={[1, -1, 1]}>
          {shapes.map((item) => (
            <mesh key={item.key}>
              <extrudeGeometry
                args={[
                  item.shape,
                  {
                    depth: 18,
                    bevelEnabled: true,
                    bevelThickness: 2,
                    bevelSize: 1,
                    bevelSegments: 3,
                  },
                ]}
              />
              <meshStandardMaterial
                color={LOGO_COLOR}
                roughness={0.25}
                metalness={0.15}
              />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}

function Fallback() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((_s, d) => {
    if (meshRef.current) meshRef.current.rotation.y += d * 2.5;
  });
  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[0.6, 0.6, 0.6]} />
      <meshStandardMaterial color={LOGO_COLOR} roughness={0.3} />
    </mesh>
  );
}

export function AsciiLogo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [resolution, setResolution] = useState(new Vector2(256, 256));

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setResolution(new Vector2(r.width, r.height));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        dpr={[1, 1]}
        gl={{ antialias: true, alpha: true, premultipliedAlpha: false }}
        style={{ background: "transparent" }}
      >
        <hemisphereLight intensity={0.6} />
        <directionalLight position={[4, 5, 5]} intensity={2.5} />
        <directionalLight position={[-4, 2, -4]} intensity={1.2} />
        <ambientLight intensity={0.4} />

        <Suspense fallback={<Fallback />}>
          <LogoMesh />
        </Suspense>

        <EffectComposer>
          <AsciiEffect
            cellSize={3}
            color
            invert={false}
            resolution={resolution}
            brightnessAdjust={0.1}
            contrastAdjust={1.3}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
