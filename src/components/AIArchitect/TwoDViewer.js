import React, { useState } from 'react';
import { Stage, Layer, Rect, Text, Line, Group, Shape } from 'react-konva';
import PropTypes from 'prop-types';
import './styles/TwoDViewer.css';

// Architectural constants
const WALL_THICKNESS = 20;
const SCALE = 50; // 1:50
const STANDARD_CEILING_HEIGHT = 280;
const ROOF_PITCH = 30; // degrees

const TwoDViewer = ({ floorData }) => {
  const [viewMode, setViewMode] = useState('top-down');

  const drawDoor = (x, y, width, isSection) => (
    <Group>
      {isSection ? (
        <Shape
          sceneFunc={(context, shape) => {
            context.beginPath();
            context.moveTo(x, y);
            context.lineTo(x + width, y);
            context.stroke();
            // Door frame
            context.rect(x - 2, y - WALL_THICKNESS, 4, WALL_THICKNESS);
            context.rect(x + width - 2, y - WALL_THICKNESS, 4, WALL_THICKNESS);
            context.fill();
          }}
          fill="#000"
          stroke="#000"
          strokeWidth={1}
        />
      ) : (
        <Shape
          sceneFunc={(context, shape) => {
            context.beginPath();
            context.moveTo(x, y);
            context.lineTo(x + width, y);
            context.arc(x, y, width, 0, -Math.PI / 2);
            context.stroke();
          }}
          stroke="#000"
          strokeWidth={1}
        />
      )}
    </Group>
  );

  const drawWindow = (x, y, width, isSection) => (
    <Group>
      {isSection ? (
        <Shape
          sceneFunc={(context, shape) => {
            context.beginPath();
            context.moveTo(x, y);
            context.lineTo(x + width, y);
            // Window frame
            context.rect(x, y - 10, width, 20);
            context.stroke();
            // Glass
            context.fillStyle = '#87CEEB';
            context.globalAlpha = 0.3;
            context.fill();
          }}
          stroke="#000"
          strokeWidth={1}
        />
      ) : (
        <Shape
          sceneFunc={(context, shape) => {
            context.beginPath();
            context.moveTo(x - 5, y);
            context.lineTo(x + width + 5, y);
            // Window sill
            context.moveTo(x, y - 5);
            context.lineTo(x + width, y - 5);
            context.moveTo(x, y + 5);
            context.lineTo(x + width, y + 5);
            context.stroke();
          }}
          stroke="#000"
          strokeWidth={1}
        />
      )}
    </Group>
  );

  const drawDimensionLine = (startX, startY, endX, endY, measurement) => (
    <Group>
      <Line
        points={[startX, startY, endX, endY]}
        stroke="#000"
        strokeWidth={1}
        dash={[5, 5]}
      />
      <Line
        points={[startX, startY - 5, startX, startY + 5]}
        stroke="#000"
        strokeWidth={1}
      />
      <Line
        points={[endX, endY - 5, endX, endY + 5]}
        stroke="#000"
        strokeWidth={1}
      />
      <Text
        x={(startX + endX) / 2 - 15}
        y={startY - 20}
        text={`${measurement}m`}
        fontSize={12}
      />
    </Group>
  );

  const renderCrossSectionView = () => (
    <Layer>
      {/* Ground and foundation */}
      <Shape
        sceneFunc={(context, shape) => {
          const baseY = 500;
          context.beginPath();
          // Ground line
          context.moveTo(0, baseY);
          context.lineTo(800, baseY);
          // Foundation
          context.moveTo(0, baseY);
          context.rect(0, baseY, 800, 40);
          context.fill();
          // Foundation hatching
          for (let x = 0; x < 800; x += 10) {
            context.moveTo(x, baseY);
            context.lineTo(x + 10, baseY + 40);
          }
          context.stroke();
        }}
        fill="#ccc"
        stroke="#666"
        strokeWidth={1}
      />

      {/* Walls and roof structure */}
      {floorData.rooms.map((room, index) => {
        const baseY = 500;
        return (
          <Group key={index}>
            {/* Walls */}
            <Shape
              sceneFunc={(context, shape) => {
                context.beginPath();
                context.rect(
                  room.position.x,
                  baseY - STANDARD_CEILING_HEIGHT,
                  room.dimensions.width,
                  STANDARD_CEILING_HEIGHT
                );
                // Wall hatching
                for (let y = baseY - STANDARD_CEILING_HEIGHT; y < baseY; y += 20) {
                  context.moveTo(room.position.x, y);
                  context.lineTo(room.position.x + WALL_THICKNESS, y + 10);
                }
                context.fill();
                context.stroke();
              }}
              fill="#f0f0f0"
              stroke="#000"
              strokeWidth={2}
            />

            {/* Roof */}
            <Shape
              sceneFunc={(context, shape) => {
                const roofHeight = Math.tan(ROOF_PITCH * Math.PI / 180) * (room.dimensions.width / 2);
                context.beginPath();
                context.moveTo(room.position.x, baseY - STANDARD_CEILING_HEIGHT);
                context.lineTo(room.position.x + room.dimensions.width / 2, 
                               baseY - STANDARD_CEILING_HEIGHT - roofHeight);
                context.lineTo(room.position.x + room.dimensions.width, 
                               baseY - STANDARD_CEILING_HEIGHT);
                context.closePath();
                context.fill();
                context.stroke();
              }}
              fill="#d4d4d4"
              stroke="#000"
              strokeWidth={2}
            />

            {/* Windows and Doors */}
            {room.windows?.map((window, idx) => 
              drawWindow(
                room.position.x + window.position.x,
                baseY - window.position.y,
                window.width,
                true
              )
            )}
            
            {room.doors?.map((door, idx) => 
              drawDoor(
                room.position.x + door.position.x,
                baseY - door.position.y,
                door.width,
                true
              )
            )}
          </Group>
        );
      })}
    </Layer>
  );

  const renderTopDownView = () => (
    <Layer>
      {floorData.rooms.map((room, index) => (
        <Group key={`room-${index}`}>
          {/* Room outline */}
          <Rect
            x={room.position.x}
            y={room.position.y}
            width={room.dimensions.width}
            height={room.dimensions.length}
            fill="#f0f0f0"
            stroke="#000"
            strokeWidth={2}
          />
          
          {/* Room name */}
          <Text
            x={room.position.x + 5}
            y={room.position.y + 5}
            text={room.name}
            fontSize={14}
            fill="#000"
          />

          {/* Doors */}
          {room.doors?.map((door, dIndex) => 
            drawDoor(
              room.position.x + door.position.x,
              room.position.y + door.position.y,
              door.width,
              door.height,
              false
            )
          )}

          {/* Windows */}
          {room.windows?.map((window, wIndex) => 
            drawWindow(
              room.position.x + window.position.x,
              room.position.y + window.position.y,
              window.width,
              window.height,
              false
            )
          )}

          {/* Dimensions */}
          {drawDimensionLine(
            room.position.x,
            room.position.y + room.dimensions.length + 20,
            room.position.x + room.dimensions.width,
            room.position.y + room.dimensions.length + 20,
            (room.dimensions.width / SCALE).toFixed(2)
          )}
        </Group>
      ))}
    </Layer>
  );

  return (
    <div className="viewer-container">
      <div className="viewer-controls">
        <button 
          onClick={() => setViewMode(viewMode === 'top-down' ? 'cross-section' : 'top-down')}
          className={`view-toggle ${viewMode}`}
        >
          Switch to {viewMode === 'top-down' ? 'Cross-Section' : 'Top-Down'} View
        </button>
      </div>
      <Stage width={800} height={600} className="two-d-viewer">
        {viewMode === 'top-down' ? renderTopDownView() : renderCrossSectionView()}
      </Stage>
    </div>
  );
};

TwoDViewer.propTypes = {
  floorData: PropTypes.shape({
    floorNumber: PropTypes.number.isRequired,
    rooms: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        dimensions: PropTypes.shape({
          width: PropTypes.number.isRequired,
          length: PropTypes.number.isRequired,
        }).isRequired,
        position: PropTypes.shape({
          x: PropTypes.number.isRequired,
          y: PropTypes.number.isRequired
        }).isRequired,
        doors: PropTypes.array,
        windows: PropTypes.array,
      })
    ).isRequired
  }).isRequired
};

export default TwoDViewer;