import React, { useRef, useEffect } from 'react';

const TrussVisualization = ({ nodes, members, results }) => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const padding = 50;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (nodes.length < 2) return;
    
    // Calculate scale to fit the truss in canvas
    const xValues = nodes.map(node => node.x);
    const yValues = nodes.map(node => node.y);
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);
    
    const width = maxX - minX;
    const height = maxY - minY;
    const scaleX = (canvas.width - padding * 2) / (width || 1);
    const scaleY = (canvas.height - padding * 2) / (height || 1);
    const scale = Math.min(scaleX, scaleY);
    
    // Transform coordinates
    const transformX = x => padding + (x - minX) * scale;
    const transformY = y => canvas.height - padding - (y - minY) * scale;
    
    // Draw members
    members.forEach(member => {
      const startNode = nodes.find(n => n.id === member.startNode);
      const endNode = nodes.find(n => n.id === member.endNode);
      if (!startNode || !endNode) return;
      
      ctx.beginPath();
      ctx.moveTo(transformX(startNode.x), transformY(startNode.y));
      ctx.lineTo(transformX(endNode.x), transformY(endNode.y));
      
      // If results exist, color based on tension/compression
      if (results) {
        const memberResult = results.members.find(m => m.id === member.id);
        if (memberResult) {
          ctx.strokeStyle = memberResult.type === 'Tension' ? '#4caf50' : '#f44336';
          // Line thickness based on relative force magnitude
          const maxForce = Math.max(...results.members.map(m => Math.abs(m.force)));
          const relativeThickness = 1 + 4 * (Math.abs(memberResult.force) / maxForce);
          ctx.lineWidth = relativeThickness;
        } else {
          ctx.strokeStyle = '#888';
          ctx.lineWidth = 2;
        }
      } else {
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 2;
      }
      
      ctx.stroke();
      
      // Label member
      const midX = (transformX(startNode.x) + transformX(endNode.x)) / 2;
      const midY = (transformY(startNode.y) + transformY(endNode.y)) / 2;
      ctx.fillStyle = '#fff';
      ctx.font = '12px Arial';
      ctx.fillText(member.id, midX + 5, midY - 5);
    });
    
    // Draw nodes
    nodes.forEach(node => {
      ctx.beginPath();
      ctx.arc(transformX(node.x), transformY(node.y), 8, 0, 2 * Math.PI);
      
      // Color based on support type
      if (node.support === 'pin') {
        ctx.fillStyle = '#2196f3';
      } else if (node.support === 'roller') {
        ctx.fillStyle = '#ff9800';
      } else {
        ctx.fillStyle = '#9c27b0';
      }
      
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Label node
      ctx.fillStyle = '#fff';
      ctx.font = '14px Arial';
      ctx.fillText(node.id, transformX(node.x) - 4, transformY(node.y) + 4);
      
      // Draw force arrows if applicable
      if (node.fx !== 0 || node.fy !== 0) {
        const arrowLength = 30;
        
        if (node.fx !== 0) {
          const direction = node.fx > 0 ? 1 : -1;
          ctx.beginPath();
          ctx.moveTo(transformX(node.x), transformY(node.y));
          ctx.lineTo(transformX(node.x) + arrowLength * direction, transformY(node.y));
          ctx.strokeStyle = '#FF5722';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Arrow head
          ctx.beginPath();
          ctx.moveTo(transformX(node.x) + arrowLength * direction, transformY(node.y));
          ctx.lineTo(transformX(node.x) + arrowLength * direction * 0.7, transformY(node.y) + 5);
          ctx.lineTo(transformX(node.x) + arrowLength * direction * 0.7, transformY(node.y) - 5);
          ctx.fillStyle = '#FF5722';
          ctx.fill();
        }
        
        if (node.fy !== 0) {
          const direction = node.fy > 0 ? 1 : -1;
          ctx.beginPath();
          ctx.moveTo(transformX(node.x), transformY(node.y));
          ctx.lineTo(transformX(node.x), transformY(node.y) - arrowLength * direction);
          ctx.strokeStyle = '#FF5722';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Arrow head
          ctx.beginPath();
          ctx.moveTo(transformX(node.x), transformY(node.y) - arrowLength * direction);
          ctx.lineTo(transformX(node.x) + 5, transformY(node.y) - arrowLength * direction * 0.7);
          ctx.lineTo(transformX(node.x) - 5, transformY(node.y) - arrowLength * direction * 0.7);
          ctx.fillStyle = '#FF5722';
          ctx.fill();
        }
      }
    });
    
  }, [nodes, members, results]);
  
  return (
    <div className="visualization">
      <canvas ref={canvasRef} width={600} height={400} className="truss-canvas" />
    </div>
  );
};

export default TrussVisualization;