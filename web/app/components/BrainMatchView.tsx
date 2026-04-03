"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { TickResult } from "../engine";
import { ACTIVE_CHANNELS, GRID_SIZE, EXCLUDED_CHANNELS } from "../engine";

const CHANNEL_TO_INDEX = new Map<number, number>();
let _idx = 0;
for (let ch = 0; ch < GRID_SIZE * GRID_SIZE; ch++) {
  if (!EXCLUDED_CHANNELS.has(ch)) {
    CHANNEL_TO_INDEX.set(ch, _idx);
    _idx++;
  }
}

function channelToGrid(ch: number): [number, number] {
  return [ch % GRID_SIZE, Math.floor(ch / GRID_SIZE)];
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

interface BrainMatchViewProps {
  tickRef: React.RefObject<TickResult | null>;
  scoreRef?: React.RefObject<HTMLDivElement | null>;
}

function createBrainGroup(scene: THREE.Scene, offsetX: number): Electrode[] {
  const electrodes: Electrode[] = [];
  const geometry = new THREE.SphereGeometry(0.045, 12, 12);

  for (let ch = 0; ch < GRID_SIZE * GRID_SIZE; ch++) {
    if (EXCLUDED_CHANNELS.has(ch)) continue;

    const [row, col] = channelToGrid(ch);
    const x = (col - (GRID_SIZE - 1) / 2) * 0.3;
    const z = (row - (GRID_SIZE - 1) / 2) * 0.3;
    const distFromCenter = Math.sqrt(x * x + z * z);
    const y = Math.sqrt(Math.max(0, 1.6 - distFromCenter * distFromCenter)) * 0.15;

    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0.15, 0.4, 0.8),
      transparent: true,
      opacity: 0.5,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x + offsetX, y, z);
    scene.add(mesh);

    electrodes.push({
      mesh,
      basePosition: new THREE.Vector3(x + offsetX, y, z),
      channel: ch,
      activity: 0,
      targetActivity: 0,
      stimActivity: 0,
      connections: [],
    });
  }

  // Build connections
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

  // Draw connections
  const drawnPairs = new Set<string>();
  for (let i = 0; i < electrodes.length; i++) {
    for (const connIdx of electrodes[i].connections) {
      const pairKey = `${Math.min(i, connIdx)}-${Math.max(i, connIdx)}`;
      if (drawnPairs.has(pairKey)) continue;
      drawnPairs.add(pairKey);

      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        electrodes[i].basePosition,
        electrodes[connIdx].basePosition,
      ]);
      const lineMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(0.1, 0.25, 0.6),
        transparent: true,
        opacity: 0.08,
      });
      scene.add(new THREE.Line(lineGeo, lineMat));
    }
  }

  return electrodes;
}

function updateElectrodes(
  electrodes: Electrode[],
  spikes: { channel: number }[],
  stimChannels: number[],
  tintR: number,
  tintG: number,
  tintB: number,
): void {
  // Apply spike data
  for (const spike of spikes) {
    const idx = CHANNEL_TO_INDEX.get(spike.channel);
    if (idx !== undefined && idx < electrodes.length) {
      electrodes[idx].targetActivity = Math.min(
        1,
        electrodes[idx].targetActivity + 0.3
      );
    }
  }

  // Apply stim data
  for (const ch of stimChannels) {
    const idx = CHANNEL_TO_INDEX.get(ch);
    if (idx !== undefined && idx < electrodes.length) {
      electrodes[idx].stimActivity = 0.8;
    }
  }

  // Animate
  for (const electrode of electrodes) {
    electrode.activity +=
      (electrode.targetActivity - electrode.activity) * 0.08;
    electrode.targetActivity *= 0.96;
    electrode.stimActivity *= 0.92;

    const mat = electrode.mesh.material as THREE.MeshBasicMaterial;
    const stim = electrode.stimActivity;
    const r = tintR * 0.3 + electrode.activity * 0.6 + stim * 0.8;
    const g = tintG * 0.3 + electrode.activity * 0.5 + stim * 0.3;
    const b = tintB * 0.3 + electrode.activity * 0.3 - stim * 0.3;
    mat.color.setRGB(Math.min(1, r), Math.min(1, g), Math.max(0, b));
    mat.opacity = 0.3 + Math.max(electrode.activity, stim) * 0.7;

    const scale = 1 + Math.max(electrode.activity, stim) * 1.5;
    electrode.mesh.scale.setScalar(scale);
    electrode.mesh.position.y =
      electrode.basePosition.y + electrode.activity * 0.04;
  }
}

export default function BrainMatchView({ tickRef, scoreRef }: BrainMatchViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // --- Brain scene ---
    const brainScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 5.5, 2.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.autoClear = false;
    container.appendChild(renderer.domElement);

    // Two brains: left at x=-2, right at x=+2
    const leftElectrodes = createBrainGroup(brainScene, -2);
    const rightElectrodes = createBrainGroup(brainScene, 2);

    // --- Pong scene ---
    const aspect = container.clientWidth / container.clientHeight;
    const pongScene = new THREE.Scene();
    const pongCamera = new THREE.OrthographicCamera(
      -aspect,
      aspect,
      1,
      -1,
      0,
      10
    );
    pongCamera.position.z = 1;

    const fieldW = 1.2;
    const fieldH = 0.8;
    const fieldX = 0;

    const bgGeo = new THREE.PlaneGeometry(fieldW, fieldH);
    const bgMat = new THREE.MeshBasicMaterial({
      color: 0x050508,
      transparent: true,
      opacity: 0.8,
    });
    const pongBg = new THREE.Mesh(bgGeo, bgMat);
    pongBg.position.set(fieldX, 0, 0);
    pongScene.add(pongBg);

    // Center dashed line
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

    // Paddles
    const paddleGeo = new THREE.PlaneGeometry(0.02, 0.12);
    const leftPaddleMat = new THREE.MeshBasicMaterial({
      color: 0x64b4ff,
      transparent: true,
      opacity: 0.8,
    });
    const leftPaddle = new THREE.Mesh(paddleGeo, leftPaddleMat);
    leftPaddle.position.set(fieldX - fieldW / 2 + 0.04, 0, 0.01);
    pongScene.add(leftPaddle);

    const rightPaddleMat = new THREE.MeshBasicMaterial({
      color: 0xff8c3c,
      transparent: true,
      opacity: 0.8,
    });
    const rightPaddle = new THREE.Mesh(paddleGeo.clone(), rightPaddleMat);
    rightPaddle.position.set(fieldX + fieldW / 2 - 0.04, 0, 0.01);
    pongScene.add(rightPaddle);

    // Ball
    const ballGeo = new THREE.CircleGeometry(0.012, 16);
    const ballMat = new THREE.MeshBasicMaterial({
      color: 0xdce6ff,
      transparent: true,
      opacity: 0.9,
    });
    const ball = new THREE.Mesh(ballGeo, ballMat);
    ball.position.set(fieldX, 0, 0.02);
    pongScene.add(ball);

    let time = 0;
    let animationId: number;

    function animate() {
      time += 0.016;

      const tick = tickRef.current;
      if (tick) {
        // Update brains — left=blue tint, right=orange tint
        updateElectrodes(
          leftElectrodes,
          tick.leftSpikes,
          tick.leftStimChannels,
          0.15, 0.4, 0.8
        );
        updateElectrodes(
          rightElectrodes,
          tick.rightSpikes,
          tick.rightStimChannels,
          0.8, 0.4, 0.15
        );

        // Update Pong
        const g = tick.game;
        ball.position.x = fieldX + (g.ballX - 0.5) * fieldW;
        ball.position.y = (0.5 - g.ballY) * fieldH;
        leftPaddle.position.y = (0.5 - g.leftPaddleY) * fieldH;
        rightPaddle.position.y = (0.5 - g.rightPaddleY) * fieldH;

        if (scoreRef?.current) {
          scoreRef.current.textContent = `${g.leftScore}  :  ${g.rightScore}`;
        }
      }

      // Subtle rotation — keep the grid readable from above
      brainScene.rotation.y = Math.sin(time * 0.1) * 0.08;
      brainScene.rotation.x = Math.sin(time * 0.07) * 0.02;

      renderer.clear();
      renderer.render(brainScene, camera);
      renderer.clearDepth();
      renderer.render(pongScene, pongCamera);

      animationId = requestAnimationFrame(animate);
    }

    animationId = requestAnimationFrame(animate);

    function handleResize() {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
      const newAspect = container.clientWidth / container.clientHeight;
      pongCamera.left = -newAspect;
      pongCamera.right = newAspect;
      pongCamera.updateProjectionMatrix();
    }

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
      container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0" />;
}
