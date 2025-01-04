import React, { useRef, useEffect } from 'react';
import { setupScene } from './utils/sceneSetup';
import { createRoomGeometry } from './utils/roomGeometry';
import PropTypes from 'prop-types';
import './styles/ThreeJsViewer.css'; // Ensure CSS is imported

const ThreeJsViewer = ({ roomData, cameraPosition }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const mountElement = mountRef.current;
    const { scene, camera, renderer, controls } = setupScene(mountElement);
    sceneRef.current = { scene, camera, renderer, controls };

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      renderer.dispose();
      if (renderer.domElement.parentNode === mountElement) {
        mountElement.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current || !roomData.dimensions) return;
    const { scene } = sceneRef.current;
    createRoomGeometry(scene, roomData);
  }, [roomData]);

  useEffect(() => {
    if (!sceneRef.current || !cameraPosition) return;
    const { camera } = sceneRef.current;
    console.log('Updating camera position to:', cameraPosition);
    camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
    camera.updateProjectionMatrix();
  }, [cameraPosition]);

  return <div ref={mountRef} className="three-js-viewer" />;
};

ThreeJsViewer.propTypes = {
  roomData: PropTypes.object.isRequired,
  cameraPosition: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
    z: PropTypes.number,
  }).isRequired,
};

export default ThreeJsViewer;