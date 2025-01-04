import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './styles/AIArchitect.css';

const RoomControls = ({ roomData, onUpdate, disabled }) => {
  const [windowWidth, setWindowWidth] = useState(30);
  const [windowHeight, setWindowHeight] = useState(20);
  const [windowX, setWindowX] = useState(0);
  const [windowY, setWindowY] = useState(0);

  const addWindow = () => {
    const newWindow = {
      type: 'window',
      width: Number(windowWidth),
      height: Number(windowHeight),
      position: { x: Number(windowX), y: Number(windowY), z: 0 }
    };
    
    onUpdate({
      ...roomData,
      windows: [...(roomData.windows || []), newWindow]
    });
  };

  const [doorWidth, setDoorWidth] = useState(10);
  const [doorHeight, setDoorHeight] = useState(10);
  const [doorX, setDoorX] = useState(0);
  const [doorY, setDoorY] = useState(0);

  const addDoor = () => {
    const newDoor = {
      type: 'door',
      width: Number(doorWidth),
      height: Number(doorHeight),
      position: { x: Number(doorX), y: Number(doorY), z: 0 }
    };
    
    onUpdate({
      ...roomData,
      doors: [...(roomData.doors || []), newDoor]
    });
  };

  return (
    <div className="room-controls">
      <div className="dimensions-control">
        <label>Width (feet)</label>
        <input 
          type="number" 
          value={roomData.dimensions.width}
          onChange={(e) => onUpdate({
            ...roomData,
            dimensions: {
              ...roomData.dimensions,
              width: Number(e.target.value)
            }
          })}
          disabled={disabled}
          min="5"
          max="50"
        />
        <label>Length (feet)</label>
        <input
          type="number"
          value={roomData.dimensions.length || 0} 
          onChange={(e) => onUpdate({
            ...roomData,
            dimensions: {
              ...roomData.dimensions,
              length: Number(e.target.value)
            }
          })}
          disabled={disabled}
          min="5"
          max="50"
        />
      </div>
      <div className="features-control">
        <div>
          <label>Window Width</label>
          <input
            type="number"
            value={windowWidth}
            onChange={(e) => setWindowWidth(e.target.value)}
            disabled={disabled}
            min="1"
            max="50"
          />
          <label>Window Height</label>
          <input
            type="number"
            value={windowHeight}
            onChange={(e) => setWindowHeight(e.target.value)}
            disabled={disabled}
            min="1"
            max="50"
          />
          <label>Window X Position</label>
          <input
            type="number"
            value={windowX}
            onChange={(e) => setWindowX(e.target.value)}
            disabled={disabled}
            min="0"
            max={roomData.dimensions.width}
          />
          <label>Window Y Position</label>
          <input
            type="number"
            value={windowY}
            onChange={(e) => setWindowY(e.target.value)}
            disabled={disabled}
            min="0"
            max={roomData.dimensions.length}
          />
          <button onClick={addWindow} disabled={disabled}>
            Add Window
          </button>
        </div>

        <div>
          <label>Door Width</label>
          <input
            type="number"
            value={doorWidth}
            onChange={(e) => setDoorWidth(e.target.value)}
            disabled={disabled}
            min="1"
            max="50"
          />
          <label>Door Height</label>
          <input
            type="number"
            value={doorHeight}
            onChange={(e) => setDoorHeight(e.target.value)}
            disabled={disabled}
            min="1"
            max="50"
          />
          <label>Door X Position</label>
          <input
            type="number"
            value={doorX}
            onChange={(e) => setDoorX(e.target.value)}
            disabled={disabled}
            min="0"
            max={roomData.dimensions.width}
          />
          <label>Door Y Position</label>
          <input
            type="number"
            value={doorY}
            onChange={(e) => setDoorY(e.target.value)}
            disabled={disabled}
            min="0"
            max={roomData.dimensions.length}
          />
          <button onClick={addDoor} disabled={disabled}>
            Add Door
          </button>
        </div>
      </div>
    </div>
  );
};

RoomControls.propTypes = {
  roomData: PropTypes.shape({
    dimensions: PropTypes.shape({
      width: PropTypes.number.isRequired,
      length: PropTypes.number.isRequired,
    }).isRequired,
    doors: PropTypes.array,
    windows: PropTypes.array,
  }).isRequired,
  onUpdate: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

export default RoomControls;