import React from 'react';

const MatrixInputGrid = ({ matrix, size, onMatrixChange, matrixLabel }) => {
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${size.cols}, auto)`,
    gap: '5px',
    justifyContent: 'center',
    marginBottom: '10px',
  };

  return (
    <div className="matrix-input-container">
      <h3>{matrixLabel}</h3>
      <div style={gridStyle}>
        {matrix.map((row, rowIndex) =>
          row.map((value, colIndex) => (
            <input
              key={`${matrixLabel}-${rowIndex}-${colIndex}`}
              type="number"
              step="any" // Allow decimals
              value={value}
              onChange={(e) => onMatrixChange(rowIndex, colIndex, e.target.value)}
              aria-label={`${matrixLabel} element row ${rowIndex + 1} column ${colIndex + 1}`}
              className="matrix-cell-input"
            />
          ))
        )}
      </div>
    </div>
  );
};

export default MatrixInputGrid;