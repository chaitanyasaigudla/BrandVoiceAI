import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function ThreeCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 24;

    // 2. Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (e) {
      console.warn('WebGL not supported, falling back to CSS background');
      return;
    }

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 3. Floating Particles (Purple & Violet Glow)
    const particleCount = 200;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const colorViolet = new THREE.Color('#8b5cf6');
    const colorIndigo = new THREE.Color('#6366f1');
    const colorPink = new THREE.Color('#ec4899');

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 55;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 45;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 35;

      const mixColor = i % 3 === 0 ? colorViolet : i % 3 === 1 ? colorIndigo : colorPink;
      colors[i * 3] = mixColor.r;
      colors[i * 3 + 1] = mixColor.g;
      colors[i * 3 + 2] = mixColor.b;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.22,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // 4. Floating Geometric Objects (Glassmorphism & Wireframe)
    const geometries = [
      new THREE.IcosahedronGeometry(4, 1),
      new THREE.TorusGeometry(3.2, 0.9, 16, 40),
      new THREE.OctahedronGeometry(3.5, 0),
      new THREE.IcosahedronGeometry(2.5, 0),
    ];

    const materials = [
      new THREE.MeshPhysicalMaterial({
        color: 0x8b5cf6,
        roughness: 0.2,
        metalness: 0.1,
        transmission: 0.6,
        transparent: true,
        opacity: 0.35,
        wireframe: false,
      }),
      new THREE.MeshBasicMaterial({
        color: 0xa855f7,
        wireframe: true,
        transparent: true,
        opacity: 0.25,
      }),
      new THREE.MeshPhysicalMaterial({
        color: 0x3b82f6,
        roughness: 0.3,
        metalness: 0.2,
        transmission: 0.5,
        transparent: true,
        opacity: 0.3,
      }),
    ];

    const meshes: THREE.Mesh[] = [];

    // Mesh 1: Large Central Glass Sphere / Icosahedron
    const mesh1 = new THREE.Mesh(geometries[0], materials[0]);
    mesh1.position.set(10, 2, -5);
    scene.add(mesh1);
    meshes.push(mesh1);

    // Mesh 2: Rotating Wireframe Torus
    const mesh2 = new THREE.Mesh(geometries[1], materials[1]);
    mesh2.position.set(-12, -4, -8);
    scene.add(mesh2);
    meshes.push(mesh2);

    // Mesh 3: Octahedron
    const mesh3 = new THREE.Mesh(geometries[2], materials[2]);
    mesh3.position.set(7, -8, -12);
    scene.add(mesh3);
    meshes.push(mesh3);

    // Mesh 4: Small Accent Sphere
    const mesh4 = new THREE.Mesh(geometries[3], materials[1]);
    mesh4.position.set(-8, 8, -6);
    scene.add(mesh4);
    meshes.push(mesh4);

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const purpleLight = new THREE.PointLight(0x8b5cf6, 4, 60);
    purpleLight.position.set(8, 12, 10);
    scene.add(purpleLight);

    const blueLight = new THREE.PointLight(0x3b82f6, 3, 50);
    blueLight.position.set(-10, -10, 8);
    scene.add(blueLight);

    // 6. Mouse Interaction & Parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (event.clientY / window.innerHeight - 0.5) * 2;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // 7. Window Resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // 8. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse interpolation
      targetX += (mouseX - targetX) * 0.04;
      targetY += (mouseY - targetY) * 0.04;

      camera.position.x = targetX * 3.5;
      camera.position.y = -targetY * 2.5;
      camera.lookAt(0, 0, 0);

      // Rotate particles slowly
      particles.rotation.y = elapsedTime * 0.04;
      particles.rotation.x = elapsedTime * 0.02;

      // Rotate meshes gently
      mesh1.rotation.x = elapsedTime * 0.15;
      mesh1.rotation.y = elapsedTime * 0.2;
      mesh1.position.y = 2 + Math.sin(elapsedTime * 0.7) * 0.8;

      mesh2.rotation.x = elapsedTime * 0.2;
      mesh2.rotation.y = elapsedTime * 0.15;
      mesh2.position.y = -4 + Math.cos(elapsedTime * 0.6) * 0.7;

      mesh3.rotation.y = elapsedTime * 0.25;
      mesh3.rotation.z = elapsedTime * 0.18;

      mesh4.rotation.x = -elapsedTime * 0.2;
      mesh4.rotation.y = elapsedTime * 0.3;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at 50% 20%, rgba(139, 92, 246, 0.12), transparent 70%)',
      }}
    />
  );
}

