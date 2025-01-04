import * as THREE from 'three';
import { CSG } from 'three-csg-ts';

export const roomTransforms = {
  moveRoom: (roomGroup, position) => {
    roomGroup.position.set(position.x, position.y, position.z);
  },

  rotateRoom: (roomGroup, rotation) => {
    roomGroup.rotation.y = rotation * Math.PI / 180;
  },

  scaleRoom: (roomGroup, dimensions) => {
    const { width, length, height } = dimensions;
    roomGroup.children.forEach(child => {
      if (child.userData.type === 'wall') {
        child.scale.set(1, height, child.userData.isLengthWall ? length : width);
      } else if (child.userData.type === 'floor' || child.userData.type === 'ceiling') {
        child.scale.set(width, 1, length);
      }
    });
  },

  addWindow: (wall, windowConfig) => {
    const { width, height, position } = windowConfig;
    
    // Create window hole
    const windowGeometry = new THREE.BoxGeometry(width, height, 0.3);
    const windowMaterial = new THREE.MeshStandardMaterial({
      color: 0x87CEEB,
      transparent: true,
      opacity: 0.6,
      metalness: 0.3,
      roughness: 0.2
    });
    
    const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
    const wallCSG = CSG.fromMesh(wall);
    const windowCSG = CSG.fromMesh(windowMesh);
    const subtractedWall = CSG.toMesh(wallCSG.subtract(windowCSG), wall.material);
    
    // Position window
    const wallWidth = wall.scale.x;
    const wallHeight = wall.scale.y;
    windowMesh.position.set(
      position?.x || 0,
      position?.y || (wallHeight / 2),
      0
    );
    
    // Create window frame
    const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a4a });
    const frame = new THREE.Group();
    
    // Add frame components
    const frameThickness = 0.05;
    ['top', 'bottom', 'left', 'right'].forEach(side => {
      const frameGeom = new THREE.BoxGeometry(
        side === 'left' || side === 'right' ? frameThickness : width + frameThickness * 2,
        side === 'top' || side === 'bottom' ? frameThickness : height + frameThickness * 2,
        0.1
      );
      const framePart = new THREE.Mesh(frameGeom, frameMaterial);
      
      if (side === 'top') framePart.position.y = height/2;
      if (side === 'bottom') framePart.position.y = -height/2;
      if (side === 'left') framePart.position.x = -width/2;
      if (side === 'right') framePart.position.x = width/2;
      
      frame.add(framePart);
    });
    
    windowMesh.add(frame);
    wall.add(windowMesh);
    
    return { windowMesh, subtractedWall };
  },

  addDoor: (wall, doorConfig) => {
    const { width, height, position } = doorConfig;
    
    const doorGeometry = new THREE.BoxGeometry(width, height, 0.1);
    const doorMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.8
    });
    
    const doorMesh = new THREE.Mesh(doorGeometry, doorMaterial);
    const wallCSG = CSG.fromMesh(wall);
    const doorCSG = CSG.fromMesh(doorMesh);
    const subtractedWall = CSG.toMesh(wallCSG.subtract(doorCSG), wall.material);
    
    doorMesh.position.copy(position);
    wall.add(doorMesh);
    
    return { doorMesh, subtractedWall };
  }
};