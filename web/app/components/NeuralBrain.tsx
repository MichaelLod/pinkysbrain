"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { SpikeEvent } from "../hooks/useNeuralSocket";

const GRID_SIZE = 8;
const EXCLUDED = new Set([0, 4, 7, 56, 63]);

// CL SDK uses column-major: channel = row + col * GRID_SIZE
function channelToGrid(ch: number): [number, number] {
  return [ch % GRID_SIZE, Math.floor(ch / GRID_SIZE)];
}

// Build map: CL SDK channel -> electrode array index
const CHANNEL_TO_INDEX = new Map<number, number>();
let _idx = 0;
for (let ch = 0; ch < GRID_SIZE * GRID_SIZE; ch++) {
  if (!EXCLUDED.has(ch)) {
    CHANNEL_TO_INDEX.set(ch, _idx);
    _idx++;
  }
}

interface Electrode {
  mesh: THREE.Mesh;
  basePosition: THREE.Vector3;
  channel: number;
  activity: number;
  targetActivity: number;
  stimActivity: number;
  connections: number[];
}

interface NeuralBrainProps {
  spikeData?: SpikeEvent[];
  stimData?: SpikeEvent[];
  mode?: "demo" | "live";
}

export default function NeuralBrain({
  spikeData,
  stimData,
  mode = "demo",
}: NeuralBrainProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const spikeRef = useRef<SpikeEvent[]>([]);
  const stimRef = useRef<SpikeEvent[]>([]);

  useEffect(() => {
    spikeRef.current = spikeData ?? [];
  }, [spikeData]);

  useEffect(() => {
    stimRef.current = stimData ?? [];
  }, [stimData]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 2, 5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const electrodes: Electrode[] = [];
    const geometry = new THREE.SphereGeometry(0.06, 16, 16);

    for (let ch = 0; ch < GRID_SIZE * GRID_SIZE; ch++) {
      if (EXCLUDED.has(ch)) continue;

      const [row, col] = channelToGrid(ch);
      const x = (col - (GRID_SIZE - 1) / 2) * 0.38;
      const z = (row - (GRID_SIZE - 1) / 2) * 0.38;
      const distFromCenter = Math.sqrt(x * x + z * z);
      const y =
        Math.sqrt(Math.max(0, 2.2 - distFromCenter * distFromCenter)) * 0.5;

      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(0.15, 0.4, 0.8),
        transparent: true,
        opacity: 0.5,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      scene.add(mesh);

      electrodes.push({
        mesh,
        basePosition: new THREE.Vector3(x, y, z),
        channel: ch,
        activity: 0,
        targetActivity: 0,
        stimActivity: 0,
        connections: [],
      });
    }

    for (let i = 0; i < electrodes.length; i++) {
      const nearby = electrodes
        .filter((_, j) => j !== i)
        .sort(
          (a, b) =>
            a.basePosition.distanceTo(electrodes[i].basePosition) -
            b.basePosition.distanceTo(electrodes[i].basePosition)
        )
        .slice(0, 3);
      electrodes[i].connections = nearby.map((e) =>
        electrodes.indexOf(e)
      );
    }

    const connectionLines: THREE.Line[] = [];
    const pairIndices: [number, number][] = [];
    const drawnPairs = new Set<string>();

    for (let i = 0; i < electrodes.length; i++) {
      for (const connIdx of electrodes[i].connections) {
        const pairKey = `${Math.min(i, connIdx)}-${Math.max(i, connIdx)}`;
        if (drawnPairs.has(pairKey)) continue;
        drawnPairs.add(pairKey);

        const a = electrodes[i];
        const b = electrodes[connIdx];
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
          a.basePosition,
          b.basePosition,
        ]);
        const lineMat = new THREE.LineBasicMaterial({
          color: new THREE.Color(0.1, 0.25, 0.6),
          transparent: true,
          opacity: 0.08,
        });
        const line = new THREE.Line(lineGeo, lineMat);
        scene.add(line);
        connectionLines.push(line);
        pairIndices.push([i, connIdx]);
      }
    }

    let time = 0;
    let nextSpikeTime = 0;
    let animationId: number;

    function triggerSpikeCascade() {
      const origin = Math.floor(Math.random() * electrodes.length);
      electrodes[origin].targetActivity = 0.8 + Math.random() * 0.2;

      setTimeout(() => {
        for (const connIdx of electrodes[origin].connections) {
          electrodes[connIdx].targetActivity = 0.4 + Math.random() * 0.4;
          setTimeout(() => {
            for (const secondIdx of electrodes[connIdx].connections) {
              if (Math.random() > 0.5) {
                electrodes[secondIdx].targetActivity = 0.2 + Math.random() * 0.3;
              }
            }
          }, 80 + Math.random() * 120);
        }
      }, 50 + Math.random() * 100);
    }

    function processLiveData() {
      for (const spike of spikeRef.current) {
        const idx = CHANNEL_TO_INDEX.get(spike.ch);
        if (idx !== undefined && idx < electrodes.length) {
          electrodes[idx].targetActivity = Math.min(
            1,
            electrodes[idx].targetActivity + 0.3
          );
        }
      }
      for (const stim of stimRef.current) {
        const idx = CHANNEL_TO_INDEX.get(stim.ch);
        if (idx !== undefined && idx < electrodes.length) {
          electrodes[idx].stimActivity = 0.8;
        }
      }
    }

    function animate() {
      time += 0.016;

      if (mode === "live") {
        processLiveData();
      } else {
        if (time > nextSpikeTime) {
          triggerSpikeCascade();
          nextSpikeTime = time + 0.3 + Math.random() * 1.2;
        }
      }

      for (const electrode of electrodes) {
        electrode.activity +=
          (electrode.targetActivity - electrode.activity) * 0.08;
        electrode.targetActivity *= 0.96;
        electrode.stimActivity *= 0.92;

        const mat = electrode.mesh.material as THREE.MeshBasicMaterial;
        const stim = electrode.stimActivity;

        // Spikes: blue, stims: orange
        const r = 0.1 + electrode.activity * 0.6 + stim * 0.8;
        const g = 0.3 + electrode.activity * 0.5 + stim * 0.3;
        const b = 0.7 + electrode.activity * 0.3 - stim * 0.3;
        mat.color.setRGB(
          Math.min(1, r),
          Math.min(1, g),
          Math.max(0, b)
        );
        mat.opacity =
          0.3 + Math.max(electrode.activity, stim) * 0.7;

        const scale = 1 + Math.max(electrode.activity, stim) * 1.5;
        electrode.mesh.scale.setScalar(scale);
        electrode.mesh.position.y =
          electrode.basePosition.y + electrode.activity * 0.05;
      }

      for (let i = 0; i < connectionLines.length; i++) {
        const lineMat = connectionLines[i].material as THREE.LineBasicMaterial;
        const [ai, bi] = pairIndices[i];
        const a = electrodes[ai];
        const b = electrodes[bi];
        const combinedActivity = (a.activity + b.activity) / 2;
        lineMat.opacity = 0.04 + combinedActivity * 0.4;
        lineMat.color.setRGB(
          0.1 + combinedActivity * 0.5,
          0.25 + combinedActivity * 0.4,
          0.6 + combinedActivity * 0.3
        );
      }

      scene.rotation.y = Math.sin(time * 0.15) * 0.3;
      scene.rotation.x = Math.sin(time * 0.1) * 0.05 - 0.1;

      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    }

    animate();

    function handleResize() {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
      container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [mode]);

  return <div ref={containerRef} className="absolute inset-0" />;
}
