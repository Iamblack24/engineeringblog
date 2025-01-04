import * as THREE from 'three';
import { CSG } from 'three-csg-ts';
import { getMaterialById } from './materialPresets';

export const createRoomGeometry = (scene, roomData) => {
  console.log('Creating room geometry with data:', roomData);

  const { width, length, height } = roomData.dimensions;
  const { materials, windows = [], doors = [] } = roomData;

  const floorMat = getMaterialById('floors', (materials.floor || '').toLowerCase()) || { color: 0x808080 };
  const wallMat = getMaterialById('walls', (materials.walls || '').toLowerCase()) || { color: 0xffffff };
  const ceilMat = getMaterialById('ceiling', (materials.ceiling || '').toLowerCase()) || { color: 0xffffff };

  // Remove existing room group if any
  const existingRoom = scene.getObjectByName('roomGroup');
  if (existingRoom) {
    scene.remove(existingRoom);
    existingRoom.traverse(child => {
      if (child.isMesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => mat.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }

  const roomGroup = new THREE.Group();
  roomGroup.name = 'roomGroup';

  // Floor
  const floorGeometry = new THREE.PlaneGeometry(width, length);
  const floorMaterial = new THREE.MeshStandardMaterial({ color: floorMat.color, roughness: 0.8 });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  roomGroup.add(floor);

  // Walls
  const wallThickness = 0.2;
  const wallMaterial = new THREE.MeshStandardMaterial({ color: wallMat.color, roughness: 0.8 });

  // Front Wall
  const frontWallGeo = new THREE.BoxGeometry(width, height, wallThickness);
  const frontWall = new THREE.Mesh(frontWallGeo, wallMaterial);
  frontWall.position.set(0, height / 2, length / 2);
  roomGroup.add(frontWall);

  // Back Wall
  const backWall = frontWall.clone();
  backWall.position.z = -length / 2;
  roomGroup.add(backWall);

  // Left Wall
  const sideWallGeo = new THREE.BoxGeometry(wallThickness, height, length);
  const leftWall = new THREE.Mesh(sideWallGeo, wallMaterial);
  leftWall.position.set(-width / 2, height / 2, 0);
  roomGroup.add(leftWall);

  // Right Wall
  const rightWall = leftWall.clone();
  rightWall.position.x = width / 2;
  roomGroup.add(rightWall);

  // Ceiling
  const ceilingGeo = new THREE.PlaneGeometry(width, length);
  const ceilingMaterial = new THREE.MeshStandardMaterial({ color: ceilMat.color, roughness: 0.5 });
  const ceiling = new THREE.Mesh(ceilingGeo, ceilingMaterial);
  ceiling.rotation.x = -Math.PI / 2;
  ceiling.position.y = height;
  roomGroup.add(ceiling);

  // Simple triangular roof
  const roofGeometry = new THREE.CylinderGeometry(
    0.01,
    (width / 2) + (length / 2),
    (width + length) * 0.25,
    4,
    1,
    true
  );
  roofGeometry.rotateY(Math.PI / 4);
  const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
  const roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
  roofMesh.position.set(0, height + (width + length) * 0.125, 0);
  roomGroup.add(roofMesh);

  // Helper to subtract holes from walls
  const subtractFromMesh = (wallMesh, rect) => {
    if (!rect || rect.width <= 0 || rect.height <= 0) {
      console.warn('Skipping invalid cut:', rect);
      return;
    }

    const maxX = width / 2 - wallThickness;
    const maxY = height;
    if (
      Math.abs(rect.x) + rect.width / 2 > maxX ||
      rect.y + rect.height / 2 > maxY
    ) {
      console.warn('Hole out of bounds, skipping:', rect);
      return;
    }

    const holeGeometry = new THREE.BoxGeometry(rect.width, rect.height, wallThickness + 0.1);
    const holeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const holeMesh = new THREE.Mesh(holeGeometry, holeMaterial);
    holeMesh.position.set(rect.x, rect.y + rect.height / 2, rect.z);
    holeMesh.updateMatrix();

    try {
      const wallCSG = CSG.fromMesh(wallMesh);
      const holeCSG = CSG.fromMesh(holeMesh);
      const resultCSG = wallCSG.subtract(holeCSG);

      if (!resultCSG) {
        throw new Error('CSG subtraction resulted in null');
      }

      const resultMesh = CSG.toMesh(resultCSG, wallMesh.matrix, wallMesh.material);
      resultMesh.name = wallMesh.name;

      wallMesh.geometry.dispose();
      wallMesh.geometry = resultMesh.geometry;
      console.log('Subtracted:', rect.type, rect);
    } catch (err) {
      console.error('CSG subtraction error:', err, 'for rect:', rect);
    }
  };

  // Doors
  doors.forEach((door) => {
    console.log('Adding door:', door);
    door.z = length / 2;
    subtractFromMesh(frontWall, door);

    // 2) Add a visible door mesh
    const doorGeometry = new THREE.BoxGeometry(door.width, door.height, 0.1);
    const doorMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321
    });
    const doorMesh = new THREE.Mesh(doorGeometry, doorMaterial);
    doorMesh.position.set(
      door.x || door.position.x,
      (door.y || door.position.y) + (door.height / 2),
      (length / 2) + 0.06
    );
    roomGroup.add(doorMesh);
  });

  // Windows
  windows.forEach((window) => {
    console.log('Adding window:', window);
    window.z = length / 2;
    subtractFromMesh(frontWall, window);

    // 2) Add a visible window mesh
    const windowGeometry = new THREE.BoxGeometry(window.width, window.height, 0.05);
    const windowMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321,
      opacity: 0.5
    });
    const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
    windowMesh.position.set(
      window.x || window.position.x,
      (window.y || window.position.y) + (window.height / 2),
      (length / 2) + 0.01
    );
    roomGroup.add(windowMesh);
  });

  scene.add(roomGroup);
  console.log('Room group added to the scene:', roomGroup);
};