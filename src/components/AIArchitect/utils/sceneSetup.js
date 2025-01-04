import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export const setupScene = (mountElement) => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xeeeeee);

  // Initialize camera
  const camera = new THREE.PerspectiveCamera(
    75,
    mountElement.clientWidth / mountElement.clientHeight,
    0.1,
    1000
  );
  camera.position.set(10, 10, 10); // Adjust as needed

  // Initialize renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(mountElement.clientWidth, mountElement.clientHeight);
  mountElement.appendChild(renderer.domElement);

  // Initialize controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  // Add basic lighting
  const ambientLight = new THREE.AmbientLight(0x404040, 1.5); // Soft white light
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(10, 20, 10);
  scene.add(directionalLight);

  // Handle window resize
  window.addEventListener('resize', () => {
    const width = mountElement.clientWidth;
    const height = mountElement.clientHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  });

  return { scene, camera, renderer, controls };
};