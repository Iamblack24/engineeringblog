import React from 'react';

// Function to format numbers nicely
const formatNumber = (num) => {
    if (typeof num !== 'number') return num; // Handle non-numeric values if any
    // Avoid scientific notation for reasonably small/large numbers
    if (Math.abs(num) > 1e-6 && Math.abs(num) < 1e6) {
        return parseFloat(num.toFixed(4)); // Limit decimals
    }
    return num.toExponential(3); // Use scientific notation for very small/large
};

const MatrixDisplay = ({ matrix }) => {
  if (!matrix || matrix.length === 0) {
    return <p>No matrix data.</p>;
  }

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${matrix[0]?.length || 1}, auto)`,
    gap: '8px 12px', // Row gap, Column gap
    justifyContent: 'center',
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    backgroundColor: '#f9f9f9',
    marginTop: '10px',
    overflowX: 'auto', // Handle wide matrices
    maxWidth: '100%',
  };

  return (
    <div style={gridStyle} className="matrix-display-grid">
      {matrix.map((row, rowIndex) =>
        row.map((value, colIndex) => (
          <span key={`${rowIndex}-${colIndex}`} className="matrix-cell-display">
            {formatNumber(value)}
          </span>
        ))
      )}
    </div>
  );
};

export default MatrixDisplay;