"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { SpikeEvent, TickMessage } from "../hooks/useNeuralSocket";

const GRID_SIZE = 8;
const EXCLUDED = new Set([0, 4, 7, 56, 63]);

function channelToGrid(ch: number): [number, number] {
  return [ch % GRID_SIZE, Math.floor(ch / GRID_SIZE)];
}

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

const TICK_MS = 50;

interface NeuralBrainProps {
  spikeData?: SpikeEvent[];
  stimData?: SpikeEvent[];
  mode?: "demo" | "live";
  tickRef?: React.RefObject<TickMessage | null>;
  prevTickRef?: React.RefObject<TickMessage | null>;
  tickTimeRef?: React.RefObject<number>;
  showPong?: boolean;
  onPlayerInput?: (y: number) => void;
  scoreRef?: React.RefObject<HTMLDivElement | null>;
}

export default function NeuralBrain({
  spikeData,
  stimData,
  mode = "demo",
  tickRef,
  prevTickRef,
  tickTimeRef,
  showPong = false,
  onPlayerInput,
  scoreRef,
}: NeuralBrainProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const spikeRef = useRef<SpikeEvent[]>([]);
  const stimRef = useRef<SpikeEvent[]>([]);
  const onPlayerInputRef = useRef(onPlayerInput);
  onPlayerInputRef.current = onPlayerInput;

  useEffect(() => {
    spikeRef.current = spikeData ?? [];
  }, [spikeData]);

  useEffect(() => {
    stimRef.current = stimData ?? [];
  }, [stimData]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    const brainScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      50, container.clientWidth / container.clientHeight, 0.1, 100
    );
    camera.position.set(0, 2, 5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.autoClear = false;
    container.appendChild(renderer.domElement);

    // --- Pong scene (pure Three.js meshes) ---
    let pongScene: THREE.Scene | null = null;
    let pongCamera: THREE.OrthographicCamera | null = null;
    let playerPaddle: THREE.Mesh | null = null;
    let neuralPaddle: THREE.Mesh | null = null;
    let ball: THREE.Mesh | null = null;
    let pongBg: THREE.Mesh | null = null;

    if (showPong && tickRef && prevTickRef && tickTimeRef) {
      const aspect = container.clientWidth / container.clientHeight;

      pongScene = new THREE.Scene();
      pongCamera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, 0, 10);
      pongCamera.position.z = 1;

      const fieldW = 1.4;
      const fieldH = 1.0;
      const fieldX = -0.1;

      const bgGeo = new THREE.PlaneGeometry(fieldW, fieldH);
      const bgMat = new THREE.MeshBasicMaterial({
        color: 0x050508,
        transparent: true,
        opacity: 0.85,
      });
      pongBg = new THREE.Mesh(bgGeo, bgMat);
      pongBg.position.set(fieldX, 0, 0);
      pongScene.add(pongBg);

      const linePoints = [];
      for (let y = -fieldH / 2; y < fieldH / 2; y += 0.04) {
        linePoints.push(new THREE.Vector3(fieldX, y, 0.01));
        linePoints.push(new THREE.Vector3(fieldX, y + 0.02, 0.01));
      }
      const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x648cff,
        transparent: true,
        opacity: 0.15,
      });
      pongScene.add(new THREE.LineSegments(lineGeo, lineMat));

      const paddleGeo = new THREE.PlaneGeometry(0.02, 0.15);
      const playerMat = new THREE.MeshBasicMaterial({
        color: 0x64b4ff,
        transparent: true,
        opacity: 0.8,
      });
      playerPaddle = new THREE.Mesh(paddleGeo, playerMat);
      playerPaddle.position.set(fieldX - fieldW / 2 + 0.04, 0, 0.01);
      pongScene.add(playerPaddle);

      const neuralMat = new THREE.MeshBasicMaterial({
        color: 0xff8c3c,
        transparent: true,
        opacity: 0.8,
      });
      neuralPaddle = new THREE.Mesh(paddleGeo.clone(), neuralMat);
      neuralPaddle.position.set(fieldX + fieldW / 2 - 0.04, 0, 0.01);
      pongScene.add(neuralPaddle);

      const ballGeo = new THREE.CircleGeometry(0.015, 16);
      const ballMat = new THREE.MeshBasicMaterial({
        color: 0xdce6ff,
        transparent: true,
        opacity: 0.9,
      });
      ball = new THREE.Mesh(ballGeo, ballMat);
      ball.position.set(fieldX, 0, 0.02);
      pongScene.add(ball);

      const handleMouse = (e: MouseEvent) => {
        const rect = renderer.domElement.getBoundingClientRect();
        const y = (e.clientY - rect.top) / rect.height;
        onPlayerInputRef.current?.(Math.max(0, Math.min(1, y)));
      };
      const handleTouch = (e: TouchEvent) => {
        if (!e.touches[0]) return;
        const rect = renderer.domElement.getBoundingClientRect();
        const y = (e.touches[0].clientY - rect.top) / rect.height;
        onPlayerInputRef.current?.(Math.max(0, Math.min(1, y)));
      };
      window.addEventListener("mousemove", handleMouse);
      window.addEventListener("touchmove", handleTouch);
      (container as any)._pongCleanup = () => {
        window.removeEventListener("mousemove", handleMouse);
        window.removeEventListener("touchmove", handleTouch);
      };
    }

    // --- Brain electrodes ---
    const electrodes: Electrode[] = [];
    const geometry = new THREE.SphereGeometry(0.06, 16, 16);

    for (let ch = 0; ch < GRID_SIZE * GRID_SIZE; ch++) {
      if (EXCLUDED.has(ch)) continue;

      const [row, col] = channelToGrid(ch);
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
      brainScene.add(mesh);

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
      electrodes[i].connections = nearby.map((e) => electrodes.indexOf(e));
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
          a.basePosition, b.basePosition,
        ]);
        const lineMat = new THREE.LineBasicMaterial({
          color: new THREE.Color(0.1, 0.25, 0.6),
          transparent: true,
          opacity: 0.08,
        });
        const line = new THREE.Line(lineGeo, lineMat);
        brainScene.add(line);
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
          electrodes[idx].targetActivity = Math.min(1, electrodes[idx].targetActivity + 0.3);
        }
      }
      for (const stim of stimRef.current) {
        const idx = CHANNEL_TO_INDEX.get(stim.ch);
        if (idx !== undefined && idx < electrodes.length) {
          electrodes[idx].stimActivity = 0.8;
        }
      }
    }

    function updatePong() {
      if (!tickRef || !prevTickRef || !tickTimeRef) return;
      if (!ball || !playerPaddle || !neuralPaddle || !pongBg) return;

      const state = tickRef.current?.game;
      if (!state) return;

      const fieldW = 1.4;
      const fieldH = 1.0;
      const fieldX = -0.1;

      const elapsed = performance.now() - tickTimeRef.current;
      const t = Math.min(elapsed / TICK_MS, 2);
      const ballX = state.ball_x + state.ball_vx * t;
      const ballY = state.ball_y + state.ball_vy * t;

      const prev = prevTickRef.current?.game;
      const lerpT = Math.min(elapsed / TICK_MS, 1);
      const neuralY = prev
        ? prev.neural_paddle_y + (state.neural_paddle_y - prev.neural_paddle_y) * lerpT
        : state.neural_paddle_y;
      const playerY = prev
        ? prev.player_paddle_y + (state.player_paddle_y - prev.player_paddle_y) * lerpT
        : state.player_paddle_y;

      ball.position.x = fieldX + (ballX - 0.5) * fieldW;
      ball.position.y = (0.5 - ballY) * fieldH;

      playerPaddle.position.y = (0.5 - playerY) * fieldH;
      neuralPaddle.position.y = (0.5 - neuralY) * fieldH;

      if (scoreRef?.current) {
        scoreRef.current.textContent = `YOU ${state.player_score} : ${state.neural_score} NEURONS`;
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
        electrode.activity += (electrode.targetActivity - electrode.activity) * 0.08;
        electrode.targetActivity *= 0.96;
        electrode.stimActivity *= 0.92;

        const mat = electrode.mesh.material as THREE.MeshBasicMaterial;
        const stim = electrode.stimActivity;
        const r = 0.1 + electrode.activity * 0.6 + stim * 0.8;
        const g = 0.3 + electrode.activity * 0.5 + stim * 0.3;
        const b = 0.7 + electrode.activity * 0.3 - stim * 0.3;
        mat.color.setRGB(Math.min(1, r), Math.min(1, g), Math.max(0, b));
        mat.opacity = 0.3 + Math.max(electrode.activity, stim) * 0.7;

        const scale = 1 + Math.max(electrode.activity, stim) * 1.5;
        electrode.mesh.scale.setScalar(scale);
        electrode.mesh.position.y = electrode.basePosition.y + electrode.activity * 0.05;
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

      brainScene.rotation.y = Math.sin(time * 0.15) * 0.3;
      brainScene.rotation.x = Math.sin(time * 0.1) * 0.05 - 0.1;

      renderer.clear();
      renderer.render(brainScene, camera);

      if (showPong && pongScene && pongCamera) {
        updatePong();
        renderer.clearDepth();
        renderer.render(pongScene, pongCamera);
      }

      animationId = requestAnimationFrame(animate);
    }

    animationId = requestAnimationFrame(animate);

    function handleResize() {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
      if (pongCamera) {
        const aspect = container.clientWidth / container.clientHeight;
        pongCamera.left = -aspect;
        pongCamera.right = aspect;
        pongCamera.updateProjectionMatrix();
      }
    }

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
      (container as any)._pongCleanup?.();
      container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [mode, showPong]);

  return (
    <div ref={containerRef} className={`absolute inset-0${showPong ? " cursor-none" : ""}`} />
  );
}
