import { useEffect, useRef } from 'react';

interface AuthBackgroundProps {
  isActive: boolean;
}

export const AuthBackground = ({ isActive }: AuthBackgroundProps) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !mountRef.current) return;

    let cancelled = false;
    let cleanup: (() => void) | null = null;

    void (async () => {
      const THREE = await import('three');
      if (cancelled || !mountRef.current) return;

      while (mountRef.current.firstChild) {
        mountRef.current.removeChild(mountRef.current.firstChild);
      }

      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0x070d1e, 20, 100);

      const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 40;

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      mountRef.current.appendChild(renderer.domElement);

      const particleCount = 180;
      const particlesGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const velocities: { x: number; y: number; z: number }[] = [];

      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 60;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 60;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
        velocities.push({
          x: (Math.random() - 0.5) * 0.04,
          y: (Math.random() - 0.5) * 0.04,
          z: (Math.random() - 0.5) * 0.02,
        });
      }

      particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const particlesMaterial = new THREE.PointsMaterial({
        color: 0x93c5fd,
        size: 0.35,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
      });
      const particles = new THREE.Points(particlesGeometry, particlesMaterial);
      scene.add(particles);

      const linePositions = new Float32Array(particleCount * particleCount * 3);
      const lineGeometry = new THREE.BufferGeometry();
      lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.1,
      });
      const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
      scene.add(lines);

      let frameId = 0;
      let mouseX = 0;
      let mouseY = 0;

      const animate = () => {
        frameId = requestAnimationFrame(animate);
        const pos = particles.geometry.attributes.position.array as Float32Array;

        for (let i = 0; i < particleCount; i++) {
          pos[i * 3] += velocities[i].x;
          pos[i * 3 + 1] += velocities[i].y;
          pos[i * 3 + 2] += velocities[i].z;

          if (pos[i * 3] > 40 || pos[i * 3] < -40) velocities[i].x *= -1;
          if (pos[i * 3 + 1] > 30 || pos[i * 3 + 1] < -30) velocities[i].y *= -1;
          if (pos[i * 3 + 2] > 15 || pos[i * 3 + 2] < -15) velocities[i].z *= -1;
        }

        particles.geometry.attributes.position.needsUpdate = true;

        let lineIdx = 0;
        const connectionDistance = 8;
        for (let i = 0; i < particleCount; i++) {
          for (let j = i + 1; j < particleCount; j++) {
            const dx = pos[i * 3] - pos[j * 3];
            const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
            const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (dist < connectionDistance) {
              linePositions[lineIdx++] = pos[i * 3];
              linePositions[lineIdx++] = pos[i * 3 + 1];
              linePositions[lineIdx++] = pos[i * 3 + 2];
              linePositions[lineIdx++] = pos[j * 3];
              linePositions[lineIdx++] = pos[j * 3 + 1];
              linePositions[lineIdx++] = pos[j * 3 + 2];
            }
          }
        }

        lines.geometry.setDrawRange(0, lineIdx / 3);
        lines.geometry.attributes.position.needsUpdate = true;

        scene.rotation.y += 0.0008;
        camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.05;
        camera.position.y += (-mouseY * 0.5 - camera.position.y) * 0.05;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
      };

      const handleMouseMove = (e: MouseEvent) => {
        mouseX = e.clientX / window.innerWidth - 0.5;
        mouseY = e.clientY / window.innerHeight - 0.5;
      };
      window.addEventListener('mousemove', handleMouseMove);

      const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener('resize', handleResize);

      animate();

      cleanup = () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(frameId);
        if (mountRef.current && renderer.domElement && mountRef.current.contains(renderer.domElement)) {
          mountRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
        particlesGeometry.dispose();
        particlesMaterial.dispose();
        lineGeometry.dispose();
        lineMaterial.dispose();
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [isActive]);

  return (
    <div
      ref={mountRef}
      className={`fixed inset-0 z-0 transition-opacity duration-1000 ${
        isActive ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    />
  );
};

