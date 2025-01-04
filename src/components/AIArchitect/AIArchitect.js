import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import RoomDescriptionInput from './RoomDescriptionInput';
import TwoDViewer from './TwoDViewer'; // Import the TwoDViewer component
//import RoomControls from './RoomControls';
import MaterialSelector from './MaterialSelector';
//import ViewControls from './ViewControls';
//import { validateDimensions } from './utils/dimensionValidator';
//import { defaultSettings } from './constants/defaultSettings';
import './styles/AIArchitect.css';

const initialRoomState = {
  floors: [
    {
      floorNumber: 1,
      rooms: [
        {
          name: 'Entrance Porch',
          dimensions: { width: 80, length: 60 }, // 8' x 6'
          position: { x: 100, y: 0 },
          doors: [
            { type: 'door', width: 36, height: 80, position: { x: 22, y: 60, z: 0 } } // Main door
          ],
          windows: []
        },
        {
          name: 'Living Room',
          dimensions: { width: 180, length: 160 }, // 18' x 16'
          position: { x: 100, y: 60 },
          doors: [
            { type: 'door', width: 36, height: 80, position: { x: 22, y: 0, z: 0 } }, // From porch
            { type: 'door', width: 36, height: 80, position: { x: 180, y: 80, z: 0 } } // To dining
          ],
          windows: [
            { type: 'window', width: 48, height: 60, position: { x: 40, y: 0, z: 0 } },
            { type: 'window', width: 48, height: 60, position: { x: 120, y: 0, z: 0 } }
          ]
        },
        {
          name: 'Dining Room',
          dimensions: { width: 140, length: 120 }, // 14' x 12'
          position: { x: 280, y: 60 },
          doors: [
            { type: 'door', width: 36, height: 80, position: { x: 0, y: 80, z: 0 } }, // From living
            { type: 'door', width: 36, height: 80, position: { x: 140, y: 60, z: 0 } } // To kitchen
          ],
          windows: [
            { type: 'window', width: 48, height: 60, position: { x: 46, y: 0, z: 0 } }
          ]
        },
        {
          name: 'Kitchen',
          dimensions: { width: 120, length: 140 }, // 12' x 14'
          position: { x: 420, y: 60 },
          doors: [
            { type: 'door', width: 36, height: 80, position: { x: 0, y: 60, z: 0 } } // From dining
          ],
          windows: [
            { type: 'window', width: 36, height: 48, position: { x: 42, y: 0, z: 0 } },
            { type: 'window', width: 36, height: 48, position: { x: 120, y: 60, z: 0 } }
          ]
        },
        {
          name: 'Hallway',
          dimensions: { width: 40, length: 120 }, // 4' x 12' hallway
          position: { x: 220, y: 220 },
          doors: [],
          windows: []
        },
        {
          name: 'Master Bedroom',
          dimensions: { width: 160, length: 140 }, // 16' x 14'
          position: { x: 100, y: 220 },
          doors: [
            { type: 'door', width: 36, height: 80, position: { x: 160, y: 60, z: 0 } }
          ],
          windows: [
            { type: 'window', width: 48, height: 60, position: { x: 40, y: 140, z: 0 } },
            { type: 'window', width: 48, height: 60, position: { x: 120, y: 140, z: 0 } }
          ]
        },
        {
          name: 'Bedroom 2',
          dimensions: { width: 140, length: 120 }, // 14' x 12'
          position: { x: 260, y: 220 },
          doors: [
            { type: 'door', width: 36, height: 80, position: { x: 0, y: 60, z: 0 } }
          ],
          windows: [
            { type: 'window', width: 48, height: 60, position: { x: 46, y: 120, z: 0 } }
          ]
        },
        {
          name: 'Bathroom',
          dimensions: { width: 80, length: 100 }, // 8' x 10'
          position: { x: 400, y: 220 },
          doors: [
            { type: 'door', width: 32, height: 80, position: { x: 0, y: 50, z: 0 } }
          ],
          windows: [
            { type: 'window', width: 36, height: 48, position: { x: 22, y: 100, z: 0 } }
          ]
        }
      ]
    }
  ],
  materials: {
    walls: 'drywall',
    floor: 'wood',
    ceiling: 'flat'
  }
};

const AIArchitect = () => {
  const [roomData, setRoomData] = useState(initialRoomState);
  const [currentFloor, setCurrentFloor] = useState(0); // State to track current floor
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  //const [camera, setCamera] = useState(defaultSettings.camera);

  useEffect(() => {
    console.log('Component mounted or roomData changed');
  }, [roomData]);

  const handleDescriptionSubmit = async (description) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/generate-room', { description });
      const generatedRoom = response.data;
      setRoomData(generatedRoom);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /*const handleRoomUpdate = (updatedRoom) => {
    const updatedFloors = [...roomData.floors];
    const currentFloorData = { ...updatedFloors[currentFloor] };
    const updatedRooms = currentFloorData.rooms.map((room, index) => 
      index === 0 ? updatedRoom : room // Assuming controlling the first room
    );
    currentFloorData.rooms = updatedRooms;
    updatedFloors[currentFloor] = currentFloorData;
    setRoomData({ ...roomData, floors: updatedFloors });
  };*/

  const handleMaterialSelect = (selectedMaterials) => {
    setRoomData({ ...roomData, materials: selectedMaterials });
  };

  return (
    <div className="ai-architect-container">
      {loading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p>Generating room...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          <span>{error}</span>
          <button onClick={() => setError(null)}>&times;</button>
        </div>
      )}
      
      <div className="ai-architect-layout">
        <div className="left-panel">
          <motion.div 
            className="input-section"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2>Room Description</h2>
            <RoomDescriptionInput 
              onDescriptionSubmit={handleDescriptionSubmit}
              disabled={loading}
            />
          </motion.div>

          <motion.div 
            className="controls-section"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {/*<h2>Room Controls</h2>
            <RoomControls 
              roomData={roomData.floors[currentFloor].rooms[0]} // Assuming controlling the first room
              onUpdate={handleRoomUpdate}
              disabled={loading}
            />*/}
            <MaterialSelector 
              materials={roomData.materials}
              onSelect={handleMaterialSelect}
              disabled={loading}
            />
          </motion.div>
        </div>

        <motion.div 
          className="viewer-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="view-options">
            {roomData.floors.map((floor, index) => (
              <button 
                key={floor.floorNumber} 
                onClick={() => setCurrentFloor(index)}
                className={`floor-button ${currentFloor === index ? 'active' : ''}`}
              >
                Floor {floor.floorNumber}
              </button>
            ))}
          </div>
          <TwoDViewer floorData={roomData.floors[currentFloor]} />
          {/* 
            If you decide to keep the 3D viewer for later, you can comment it out or keep it hidden
            <ThreeJsViewer 
              roomData={roomData} 
              cameraPosition={camera.position}
            />
            <ViewControls 
              camera={camera}
              onViewChange={handleViewChange}
            />
          */}
        </motion.div>
      </div>
    </div>
  );
};

export default AIArchitect;