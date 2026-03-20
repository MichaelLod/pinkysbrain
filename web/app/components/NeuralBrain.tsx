"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const ELECTRODE_COUNT = 59;
const GRID_SIZE = 8;
const GROUND_CHANNELS = [0, 7, 56, 63];
const REF_CHANNEL = 4;
const EXCLUDED = new Set([...GROUND_CHANNELS, REF_CHANNEL]);

interface Electrode {
  mesh: THREE.Mesh;
  basePosition: THREE.Vector3;
  channel: number;
  activity: number;
  targetActivity: number;
  connections: number[];
}

export default function NeuralBrain() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 2, 5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const electrodes: Electrode[] = [];
    const geometry = new THREE.SphereGeometry(0.06, 16, 16);

    let idx = 0;
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
      if (EXCLUDED.has(i)) continue;

      const col = i % GRID_SIZE;
      const row = Math.floor(i / GRID_SIZE);

      const x = (col - (GRID_SIZE - 1) / 2) * 0.38;
      const z = (row - (GRID_SIZE - 1) / 2) * 0.38;
      const distFromCenter = Math.sqrt(x * x + z * z);
      const y = Math.sqrt(Math.max(0, 2.2 - distFromCenter * distFromCenter)) * 0.5;

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
        channel: idx,
        activity: 0,
        targetActivity: 0,
        connections: [],
      });
      idx++;
    }

    for (const electrode of electrodes) {
      const nearby = electrodes
        .filter((e) => e.channel !== electrode.channel)
        .sort(
          (a, b) =>
            a.basePosition.distanceTo(electrode.basePosition) -
            b.basePosition.distanceTo(electrode.basePosition)
        )
        .slice(0, 3);
      electrode.connections = nearby.map((e) => e.channel);
    }

    const connectionLines: THREE.Line[] = [];
    const drawnPairs = new Set<string>();

    for (const electrode of electrodes) {
      for (const connIdx of electrode.connections) {
        const pairKey = [Math.min(electrode.channel, connIdx), Math.max(electrode.channel, connIdx)].join("-");
        if (drawnPairs.has(pairKey)) continue;
        drawnPairs.add(pairKey);

        const target = electrodes[connIdx];
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
          electrode.basePosition,
          target.basePosition,
        ]);
        const lineMat = new THREE.LineBasicMaterial({
          color: new THREE.Color(0.1, 0.25, 0.6),
          transparent: true,
          opacity: 0.08,
        });
        const line = new THREE.Line(lineGeo, lineMat);
        scene.add(line);
        connectionLines.push(line);
      }
    }

    let time = 0;
    let nextSpikeTime = 0;

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

    function animate() {
      time += 0.016;

      if (time > nextSpikeTime) {
        triggerSpikeCascade();
        nextSpikeTime = time + 0.3 + Math.random() * 1.2;
      }

      for (const electrode of electrodes) {
        electrode.activity += (electrode.targetActivity - electrode.activity) * 0.08;
        electrode.targetActivity *= 0.96;

        const mat = electrode.mesh.material as THREE.MeshBasicMaterial;
        const r = 0.1 + electrode.activity * 0.6;
        const g = 0.3 + electrode.activity * 0.5;
        const b = 0.7 + electrode.activity * 0.3;
        mat.color.setRGB(r, g, b);
        mat.opacity = 0.3 + electrode.activity * 0.7;

        const scale = 1 + electrode.activity * 1.5;
        electrode.mesh.scale.setScalar(scale);

        electrode.mesh.position.y =
          electrode.basePosition.y + electrode.activity * 0.05;
      }

      for (let i = 0; i < connectionLines.length; i++) {
        const lineMat = connectionLines[i].material as THREE.LineBasicMaterial;
        const pairKey = Array.from(drawnPairs)[i];
        const [aStr, bStr] = pairKey.split("-");
        const a = electrodes[parseInt(aStr)];
        const b = electrodes[parseInt(bStr)];
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
      requestAnimationFrame(animate);
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
      container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0" />;
}
