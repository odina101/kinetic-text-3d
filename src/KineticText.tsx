import { useRef, useEffect, CSSProperties } from 'react';
import * as THREE from 'three';
import { Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';
import gsap from 'gsap';
import opentype from 'opentype.js';
import { VERTEX_SHADER, FRAGMENT_SHADER } from './shaders';
import { opentypeToTypeface } from './fontConverter';

const DEFAULT_FONT_URL = 'https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@main/hinted/ttf/NotoSansGeorgian/NotoSansGeorgian-Bold.ttf';

export interface KineticTextProps {
  text: string;
  fontUrl?: string;
  color?: string;
  glowColor?: string;
  backgroundColor?: string;
  glowIntensity?: number;
  fontSize?: number;
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: CSSProperties;
}

export function KineticText({
  text,
  fontUrl,
  color = '#ffffff',
  glowColor = '#22d3ee',
  backgroundColor = '#050505',
  glowIntensity = 0.6,
  fontSize = 1.67,
  width = '100%',
  height = '100%',
  className,
  style,
}: KineticTextProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    let disposed = false;
    let animFrameId: number;

    const rect = wrapper.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    const bgColor = new THREE.Color(backgroundColor);
    const textColor = new THREE.Color(color);
    const glowClr = new THREE.Color(glowColor);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);

    const scene = new THREE.Scene();
    scene.background = bgColor.clone();
    scene.fog = new THREE.FogExp2(bgColor.getHex(), 0.02);

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    camera.position.set(0, 0, 30);

    const mouse = new THREE.Vector2(9999, 9999);
    const raycaster = new THREE.Raycaster();
    const iPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const mouseWorld = new THREE.Vector3();

    const kineticMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector3(0, 0, 0) },
        uHover: { value: 0 },
        uColor: { value: textColor.clone() },
        uGlowColor: { value: glowClr.clone() },
      },
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
    });

    const letterMeshes: THREE.Mesh[] = [];
    const textGroup = new THREE.Group();
    scene.add(textGroup);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(w, h),
      1.5,
      0.4,
      0.85
    );
    bloomPass.threshold = 0.1;
    bloomPass.strength = glowIntensity;
    bloomPass.radius = 0.8;
    composer.addPass(bloomPass);

    const filmPass = new (FilmPass as any)(0.15, 0.025, 648, false);
    composer.addPass(filmPass);

    const resolvedFontUrl = fontUrl || DEFAULT_FONT_URL;

    opentype.load(resolvedFontUrl, (err: any, otFont: any) => {
      if (disposed) return;
      if (err) {
        console.error('KineticText: font load error', err);
        return;
      }

      const typefaceData = opentypeToTypeface(otFont);
      const font = new Font(typefaceData);

      const size = fontSize;
      const depth = fontSize * 0.16;
      const bevelThickness = fontSize * 0.02;
      const bevelSize = fontSize * 0.008;
      const tracking = fontSize * 0.08;

      let totalWidth = 0;
      text.split('').forEach((letter) => {
        if (letter === ' ') {
          totalWidth += size * 0.5;
          return;
        }
        const geo = new TextGeometry(letter, {
          font,
          size,
          height: depth,
          curveSegments: 8,
          bevelEnabled: true,
          bevelThickness,
          bevelSize,
          bevelOffset: 0,
          bevelSegments: 3,
        });
        geo.computeBoundingBox();
        totalWidth += (geo.boundingBox!.max.x - geo.boundingBox!.min.x) + tracking;
        geo.dispose();
      });

      let xOffset = -totalWidth / 2;

      text.split('').forEach((letter) => {
        if (letter === ' ') {
          xOffset += size * 0.5;
          return;
        }

        const geometry = new TextGeometry(letter, {
          font,
          size,
          height: depth,
          curveSegments: 8,
          bevelEnabled: true,
          bevelThickness,
          bevelSize,
          bevelOffset: 0,
          bevelSegments: 3,
        });

        geometry.computeBoundingBox();
        const letterW = geometry.boundingBox!.max.x - geometry.boundingBox!.min.x;
        geometry.translate(-letterW / 2, 0, 0);

        const mesh = new THREE.Mesh(geometry, kineticMaterial.clone());

        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(
          edges,
          new THREE.LineBasicMaterial({
            color: glowClr.getHex(),
            transparent: true,
            opacity: 0.3,
          })
        );
        mesh.add(line);

        mesh.position.set(xOffset + letterW / 2, 0, 0);
        mesh.userData.initialX = xOffset + letterW / 2;

        textGroup.add(mesh);
        letterMeshes.push(mesh);

        xOffset += letterW + tracking;
      });

      if (!disposed) {
        const tl = gsap.timeline();
        tl.from(letterMeshes.map((m) => m.position), {
          z: -50,
          y: () => (Math.random() - 0.5) * 20,
          duration: 2.5,
          stagger: { amount: 1, from: 'center' },
          ease: 'power3.out',
        });
        startLoop();
      }
    });

    const clock = new THREE.Clock();

    function startLoop() {
      function animate() {
        if (disposed) return;
        animFrameId = requestAnimationFrame(animate);

        const time = clock.getElapsedTime();

        raycaster.setFromCamera(mouse, camera);
        const intersect = new THREE.Vector3();
        raycaster.ray.intersectPlane(iPlane, intersect);
        mouseWorld.copy(intersect);

        letterMeshes.forEach((mesh) => {
          if ((mesh.material as THREE.ShaderMaterial).uniforms) {
            const u = (mesh.material as THREE.ShaderMaterial).uniforms;
            u.uTime.value = time;
            u.uMouse.value = mouseWorld;
          }

          const dist = mesh.position.distanceTo(mouseWorld);
          if (dist < 8) {
            const tgtY = (mouseWorld.x - mesh.position.x) * 0.1;
            const tgtX = -(mouseWorld.y - mesh.position.y) * 0.1;
            mesh.rotation.y += (tgtY - mesh.rotation.y) * 0.05;
            mesh.rotation.x += (tgtX - mesh.rotation.x) * 0.05;
          } else {
            mesh.rotation.y += (0 - mesh.rotation.y) * 0.05;
            mesh.rotation.x += (0 - mesh.rotation.x) * 0.05;
          }
        });

        camera.position.x = Math.sin(time * 0.1) * 0.5;
        camera.position.y = Math.cos(time * 0.2) * 0.5;
        camera.lookAt(0, 0, 0);

        composer.render();
      }
      animate();
    }

    function onMouseMove(e: MouseEvent) {
      const r = wrapper!.getBoundingClientRect();
      mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    }
    wrapper.addEventListener('mousemove', onMouseMove);

    const ro = new ResizeObserver((entries) => {
      if (disposed) return;
      const entry = entries[0];
      if (!entry) return;
      const { width: newW, height: newH } = entry.contentRect;
      if (newW === 0 || newH === 0) return;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
      composer.setSize(newW, newH);
    });
    ro.observe(wrapper);

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) clock.stop();
        else clock.start();
      });
    });
    io.observe(canvas);

    return () => {
      disposed = true;
      cancelAnimationFrame(animFrameId);
      wrapper.removeEventListener('mousemove', onMouseMove);
      ro.disconnect();
      io.disconnect();

      textGroup.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
        if (obj instanceof THREE.LineSegments) {
          obj.geometry.dispose();
          (obj.material as THREE.Material).dispose();
        }
      });
      scene.remove(textGroup);
      composer.dispose();
      renderer.dispose();
    };
  }, [text, fontUrl, color, glowColor, backgroundColor, glowIntensity, fontSize]);

  const wrapperStyle: CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    ...style,
  };

  return (
    <div ref={wrapperRef} className={className} style={wrapperStyle}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </div>
  );
}
