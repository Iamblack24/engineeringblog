import React, { useRef, useEffect, useCallback } from 'react'; // Import useCallback

const DiagramRenderer = ({ beamConfig, loadConfig, analysisOptions, results, beamNodes }) => {
  // References for the canvas elements
  const beamRef = useRef(null);
  const diagramRef = useRef(null);
  
  // Dimensions for the SVG viewport
  const svgWidth = 800;
  const svgHeight = 500;
  const padding = { top: 40, right: 30, bottom: 40, left: 50 };
  
  // Layout dimensions
  const beamHeight = 80;
  const diagramHeight = 150;
  const gap = 30;
  
  // Scale dimensions
  const beamLength = beamConfig.length;
  const xScale = (svgWidth - padding.left - padding.right) / beamLength;
  
  // Wrap drawing functions in useCallback to stabilize their references
  const renderBeam = useCallback(() => {
    const canvas = beamRef.current;
    if (!canvas) return; // Add guard clause
    const ctx = canvas.getContext('2d');

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the beam
    ctx.save();
    ctx.translate(padding.left, padding.top);

    // Draw the beam centerline
    ctx.beginPath();
    ctx.moveTo(0, beamHeight / 2);
    ctx.lineTo(beamConfig.length * xScale, beamHeight / 2); // Use beamConfig directly
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw supports based on support type
    switch(beamConfig.supportType) {
      // ... (rest of switch cases using beamConfig directly) ...
      case 'simply-supported':
        drawTriangleSupport(ctx, 0, beamHeight / 2 + 10);
        drawRollerSupport(ctx, beamConfig.length * xScale, beamHeight / 2 + 10);
        break;
      case 'cantilever':
        drawFixedSupport(ctx, 0, beamHeight / 2);
        break;
      case 'fixed-fixed':
        drawFixedSupport(ctx, 0, beamHeight / 2);
        drawFixedSupport(ctx, beamConfig.length * xScale, beamHeight / 2);
        break;
      case 'fixed-pinned':
        drawFixedSupport(ctx, 0, beamHeight / 2);
        drawTriangleSupport(ctx, beamConfig.length * xScale, beamHeight / 2 + 10);
        break;
      case 'multi-span':
        drawFixedSupport(ctx, 0, beamHeight / 2);
        const spanLength = beamConfig.length / beamConfig.segments;
        for (let i = 1; i < beamConfig.segments; i++) {
          drawTriangleSupport(ctx, i * spanLength * xScale, beamHeight / 2 + 10);
        }
        drawRollerSupport(ctx, beamConfig.length * xScale, beamHeight / 2 + 10);
        break;
      default:
        drawTriangleSupport(ctx, 0, beamHeight / 2 + 10);
        drawRollerSupport(ctx, beamConfig.length * xScale, beamHeight / 2 + 10);
    }

    // Draw the load
    const loadX = loadConfig.position * beamConfig.length * xScale; // Use beamConfig directly

    if (loadConfig.type === 'point') {
      drawPointLoad(ctx, loadX, beamHeight / 2 - 20, loadConfig.magnitude);
    } else if (loadConfig.type === 'distributed') {
      const width = loadConfig.width * xScale;
      const startX = loadX - width / 2;
      drawDistributedLoad(ctx, startX, beamHeight / 2 - 20, width, loadConfig.magnitude);
    } else if (loadConfig.type === 'train') {
      drawTrainLoad(ctx, loadX, beamHeight / 2 - 20, loadConfig, xScale); // Pass xScale
    }

    // Draw position markers
    drawPositionMarkers(ctx, beamConfig.length, beamHeight, xScale); // Use beamConfig directly

    // Draw influence line position indicator if showing
    if (analysisOptions.showInfluenceLine) {
      const influenceX = analysisOptions.influenceLinePosition * beamConfig.length * xScale; // Use beamConfig directly
      ctx.beginPath();
      ctx.moveTo(influenceX, beamHeight / 2 - 15);
      ctx.lineTo(influenceX, beamHeight / 2 + 15);
      ctx.strokeStyle = 'purple';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = 'purple';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('IL', influenceX, beamHeight / 2 - 20);
    }

    ctx.restore();
  }, [beamConfig, loadConfig, analysisOptions.showInfluenceLine, analysisOptions.influenceLinePosition, xScale]); // Add dependencies

  const renderDiagrams = useCallback(() => {
    const canvas = diagramRef.current;
    if (!canvas) return; // Add guard clause
    const ctx = canvas.getContext('2d');

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(padding.left, padding.top + beamHeight + gap);

    // Find maximum values for scaling
    const maxBM = results.bendingMoment.length > 0 ?
      Math.max(1, ...results.bendingMoment.map(Math.abs)) : 1; // Ensure max is at least 1
    const maxSF = results.shearForce.length > 0 ?
      Math.max(1, ...results.shearForce.map(Math.abs)) : 1; // Ensure max is at least 1
    const maxIL = results.influenceLine.length > 0 ?
      Math.max(1, ...results.influenceLine.map(Math.abs)) : 1; // Ensure max is at least 1
    const maxDeflection = results.deflection.length > 0 ?
      Math.max(1e-6, ...results.deflection.map(Math.abs)) : 1e-6; // Ensure max is non-zero positive

    // Calculate scales for each diagram
    const bmScale = diagramHeight / (2 * maxBM);
    const sfScale = diagramHeight / (2 * maxSF);
    const ilScale = diagramHeight / (2 * maxIL); // Adjusted IL scale logic
    const deflectionScale = diagramHeight / (2 * maxDeflection);

    // Draw the diagram axes
    let currentY = 0;
    const diagramXLength = beamConfig.length * xScale; // Use beamConfig directly

    // Draw bending moment diagram
    if (analysisOptions.showBendingMoment && results.bendingMoment.length > 0) {
      drawDiagramAxis(ctx, 0, currentY, diagramXLength, currentY, 'Bending Moment');

      ctx.beginPath();
      for (let i = 0; i < results.bendingMoment.length; i++) {
        const x = (i / (results.bendingMoment.length - 1)) * diagramXLength;
        const y = currentY - results.bendingMoment[i] * bmScale;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Show envelope if enabled
      if (analysisOptions.showEnvelope && results.envelope?.maxBendingMoment?.length > 0) {
        ctx.beginPath();
        for (let i = 0; i < results.envelope.maxBendingMoment.length; i++) {
          const x = (i / (results.envelope.maxBendingMoment.length - 1)) * diagramXLength;
          const y = currentY - results.envelope.maxBendingMoment[i] * bmScale; // Draw positive envelope
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
         for (let i = results.envelope.maxBendingMoment.length - 1; i >= 0; i--) { // Draw negative envelope
           const x = (i / (results.envelope.maxBendingMoment.length - 1)) * diagramXLength;
           const y = currentY + results.envelope.maxBendingMoment[i] * bmScale; // Draw negative envelope part
           ctx.lineTo(x, y);
         }
         ctx.closePath();
         ctx.fillStyle = 'rgba(255, 0, 0, 0.1)'; // Fill envelope
         ctx.fill();
         ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
         ctx.lineWidth = 1;
         ctx.stroke();
      }
      currentY += diagramHeight + gap;
    }

    // Draw shear force diagram
    if (analysisOptions.showShearForce && results.shearForce.length > 0) {
      drawDiagramAxis(ctx, 0, currentY, diagramXLength, currentY, 'Shear Force');

      ctx.beginPath();
      for (let i = 0; i < results.shearForce.length; i++) {
        const x = (i / (results.shearForce.length - 1)) * diagramXLength;
        const y = currentY - results.shearForce[i] * sfScale;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'blue';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Show envelope if enabled
      if (analysisOptions.showEnvelope && results.envelope?.maxShearForce?.length > 0) {
         ctx.beginPath();
         for (let i = 0; i < results.envelope.maxShearForce.length; i++) {
           const x = (i / (results.envelope.maxShearForce.length - 1)) * diagramXLength;
           const y = currentY - results.envelope.maxShearForce[i] * sfScale;
           if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
         }
         for (let i = results.envelope.maxShearForce.length - 1; i >= 0; i--) {
           const x = (i / (results.envelope.maxShearForce.length - 1)) * diagramXLength;
           const y = currentY + results.envelope.maxShearForce[i] * sfScale;
           ctx.lineTo(x, y);
         }
         ctx.closePath();
         ctx.fillStyle = 'rgba(0, 0, 255, 0.1)';
         ctx.fill();
         ctx.strokeStyle = 'rgba(0, 0, 255, 0.3)';
         ctx.lineWidth = 1;
         ctx.stroke();
      }
      currentY += diagramHeight + gap;
    }

    // Draw influence line
    if (analysisOptions.showInfluenceLine && results.influenceLine.length > 0) {
      drawDiagramAxis(ctx, 0, currentY, diagramXLength, currentY, 'Influence Line');

      ctx.beginPath();
      for (let i = 0; i < results.influenceLine.length; i++) {
        const x = (i / (results.influenceLine.length - 1)) * diagramXLength;
        const y = currentY - results.influenceLine[i] * ilScale; // Adjusted IL scaling
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'purple';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw value at load position
      const loadIndex = Math.floor(loadConfig.position * (results.influenceLine.length - 1));
      if (loadIndex >= 0 && loadIndex < results.influenceLine.length) {
        const loadX = loadConfig.position * diagramXLength;
        const loadY = currentY - results.influenceLine[loadIndex] * ilScale; // Adjusted IL scaling
        ctx.beginPath();
        ctx.arc(loadX, loadY, 4, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
      }
      currentY += diagramHeight + gap;
    }

    // Draw deflection diagram
    if (analysisOptions.showDeflection && results.deflection.length > 0) {
      drawDiagramAxis(ctx, 0, currentY, diagramXLength, currentY, 'Deflection');

      ctx.beginPath();
      for (let i = 0; i < results.deflection.length; i++) {
        const x = (i / (results.deflection.length - 1)) * diagramXLength;
        // Deflection is typically plotted downwards positive
        const y = currentY + results.deflection[i] * deflectionScale;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'green';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.restore();
  }, [results, analysisOptions, beamConfig.length, xScale, loadConfig.position]); // Add dependencies

  useEffect(() => {
    renderBeam();
    renderDiagrams();
  }, [renderBeam, renderDiagrams]); // Use the memoized functions as dependencies

  // Helper drawing functions
  const drawTriangleSupport = (ctx, x, y) => {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 10, y + 15);
    ctx.lineTo(x + 10, y + 15);
    ctx.closePath();
    ctx.fillStyle = '#333';
    ctx.fill();
    
    // Draw the ground line
    ctx.beginPath();
    ctx.moveTo(x - 15, y + 15);
    ctx.lineTo(x + 15, y + 15);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();
  };
  
  const drawRollerSupport = (ctx, x, y) => {
    // Draw the roller circle
    ctx.beginPath();
    ctx.arc(x, y + 5, 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#333';
    ctx.fill();
    
    // Draw triangle above
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 10, y + 5);
    ctx.lineTo(x + 10, y + 5);
    ctx.closePath();
    ctx.fill();
    
    // Draw the ground line
    ctx.beginPath();
    ctx.moveTo(x - 15, y + 15);
    ctx.lineTo(x + 15, y + 15);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();
  };
  
  const drawFixedSupport = (ctx, x, y) => {
    // Draw the fixed support rectangle
    ctx.beginPath();
    ctx.rect(x - 5, y - 20, 10, 40);
    ctx.fillStyle = '#333';
    ctx.fill();
    
    // Draw the anchor lines
    for (let i = -15; i <= 15; i += 10) {
      ctx.beginPath();
      ctx.moveTo(x - 5, y + i);
      ctx.lineTo(x - 15, y + i);
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };
  
  const drawPointLoad = (ctx, x, y, magnitude) => {
    // Draw the arrow
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + 30);
    ctx.strokeStyle = '#E91E63';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw the arrow head
    ctx.beginPath();
    ctx.moveTo(x, y + 30);
    ctx.lineTo(x - 5, y + 25);
    ctx.lineTo(x + 5, y + 25);
    ctx.closePath();
    ctx.fillStyle = '#E91E63';
    ctx.fill();
    
    // Draw the magnitude
    ctx.fillStyle = '#E91E63';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${magnitude} kN`, x, y - 5);
  };
  
  const drawDistributedLoad = (ctx, x, y, width, magnitude) => {
    // Draw the distributed load arrows
    const numArrows = Math.max(2, Math.floor(width / 20));
    const arrowSpacing = width / (numArrows - 1);
    
    for (let i = 0; i < numArrows; i++) {
      const arrowX = x + i * arrowSpacing;
      
      ctx.beginPath();
      ctx.moveTo(arrowX, y);
      ctx.lineTo(arrowX, y + 20);
      ctx.strokeStyle = '#E91E63';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw the arrow head
      ctx.beginPath();
      ctx.moveTo(arrowX, y + 20);
      ctx.lineTo(arrowX - 3, y + 17);
      ctx.lineTo(arrowX + 3, y + 17);
      ctx.closePath();
      ctx.fillStyle = '#E91E63';
      ctx.fill();
    }
    
    // Draw the top line
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.strokeStyle = '#E91E63';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw the magnitude
    ctx.fillStyle = '#E91E63';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${magnitude} kN/m`, x + width / 2, y - 5);
  };
  
  const drawTrainLoad = (ctx, x, y, loadConfig, currentXScale) => { // Accept xScale
    // For train loads, draw series of vehicles
    const { trainLoads = [] } = loadConfig; // Default to empty array

    if (!trainLoads || trainLoads.length === 0) {
      // Fallback to simple point load if no axle configuration
      drawPointLoad(ctx, x, y, loadConfig.magnitude);
      return;
    }

    // Position of the first axle is 'x'
    let currentAxleX = x;

    // Draw each axle load
    trainLoads.forEach((axle, index) => {
      const axlePositionOffset = (axle.position || 0) * currentXScale; // Use passed xScale
      const absoluteAxleX = x + axlePositionOffset; // Position relative to train start 'x'

      // Draw the axle load (smaller point loads)
      drawPointLoad(ctx, absoluteAxleX, y, axle.magnitude);
    });

    // Optional: Draw vehicle body (simplified rectangle above the axles)
    // Calculate total train length based on last axle position
    const lastAxleRelativePos = trainLoads.length > 0 ? (trainLoads[trainLoads.length - 1].position || 0) : 0;
    const trainDrawLength = Math.max(20, lastAxleRelativePos * currentXScale + 20); // Add some padding

    ctx.beginPath();
    ctx.rect(x - 10, y - 15, trainDrawLength, 10); // Adjust width based on axles
    ctx.fillStyle = 'rgba(233, 30, 99, 0.3)';
    ctx.fill();
    ctx.strokeStyle = '#E91E63';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Add a label for the train load
    ctx.fillStyle = '#E91E63';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Train Load', x + trainDrawLength / 2 - 10, y - 20);
  };
  
  const drawPositionMarkers = (ctx, beamLength, beamHeight, xScale) => {
    // Draw position markers along the beam
    const numMarkers = Math.min(11, beamLength + 1); // Maximum 11 markers (0, 0.1, 0.2, ..., 1.0)
    const markerSpacing = beamLength / (numMarkers - 1);
    
    ctx.fillStyle = '#666';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    
    for (let i = 0; i < numMarkers; i++) {
      const x = i * markerSpacing * xScale;
      const position = (i * markerSpacing).toFixed(1);
      
      // Draw tick mark
      ctx.beginPath();
      ctx.moveTo(x, beamHeight / 2 - 5);
      ctx.lineTo(x, beamHeight / 2 + 5);
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Draw position label
      ctx.fillText(position, x, beamHeight / 2 + 20);
    }
    
    // Add units label
    ctx.fillText('Position (m)', beamLength * xScale / 2, beamHeight / 2 + 35);
  };
  
  const drawDiagramAxis = (ctx, x1, y1, x2, y2, label) => {
    // Draw horizontal zero line
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y1);
    ctx.strokeStyle = '#999';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Add axis label
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(label, 0, y1 - 10);
    
    // Draw y-axis
    ctx.beginPath();
    ctx.moveTo(0, y1 - diagramHeight / 2);
    ctx.lineTo(0, y1 + diagramHeight / 2);
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw tick marks on y-axis
    const tickCount = 5;
    const tickSpacing = diagramHeight / (tickCount - 1);
    
    for (let i = 0; i < tickCount; i++) {
      const tickY = y1 - diagramHeight / 2 + i * tickSpacing;
      
      ctx.beginPath();
      ctx.moveTo(-5, tickY);
      ctx.lineTo(5, tickY);
      ctx.strokeStyle = '#999';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  };

  return (
    <div className="diagram-renderer">
      <canvas 
        ref={beamRef} 
        width={svgWidth} 
        height={beamHeight + padding.top + padding.bottom}
        className="beam-canvas"
      />
      <canvas 
        ref={diagramRef}
        width={svgWidth}
        height={svgHeight - beamHeight - padding.top - padding.bottom}
        className="diagram-canvas"
      />
      {/* Optional legend */}
      <div className="diagram-legend">
        {analysisOptions.showBendingMoment && (
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: 'red' }}></div>
            <div className="legend-label">Bending Moment (kN·m)</div>
          </div>
        )}
        {analysisOptions.showShearForce && (
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: 'blue' }}></div>
            <div className="legend-label">Shear Force (kN)</div>
          </div>
        )}
        {analysisOptions.showInfluenceLine && (
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: 'purple' }}></div>
            <div className="legend-label">Influence Line</div>
          </div>
        )}
        {analysisOptions.showDeflection && (
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: 'green' }}></div>
            <div className="legend-label">Deflection (mm)</div>
          </div>
        )}
        {analysisOptions.showEnvelope && (
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: 'rgba(255,0,0,0.3)', border: '1px solid rgba(255,0,0,0.6)' }}></div>
            <div className="legend-label">Envelope (max values)</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiagramRenderer;