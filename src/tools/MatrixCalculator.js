import React, { useState, useCallback } from 'react';
import { add, subtract, multiply, transpose, det, inv, multiply as scalarMultiply } from 'mathjs';
import numeric from 'numeric'; // For eigenvalue and eigenvector computation
import MatrixInputGrid from './MatrixInputGrid'; // Import helper component
import MatrixDisplay from './MatrixDisplay'; // Import helper component
import './MatrixCalculator.css';

const MatrixCalculator = () => {
  const [matrixA, setMatrixA] = useState([[1, 0], [0, 1]]); // Default to identity
  const [matrixB, setMatrixB] = useState([[1, 0], [0, 1]]); // Default to identity
  const [scalar, setScalar] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [sizeA, setSizeA] = useState({ rows: 2, cols: 2 });
  const [sizeB, setSizeB] = useState({ rows: 2, cols: 2 });
  const [operationInfo, setOperationInfo] = useState(''); // To describe the result

  // Adjust matrix size, preserving existing values
  const adjustMatrixSize = useCallback((setMatrix, currentMatrix, newSize) => {
    const { rows, cols } = newSize;
    // Ensure rows/cols are positive integers
    const validRows = Math.max(1, Math.floor(rows));
    const validCols = Math.max(1, Math.floor(cols));

    const newMatrix = Array.from({ length: validRows }, (_, i) =>
      Array.from({ length: validCols }, (_, j) => (currentMatrix[i]?.[j] ?? 0)) // Use ?? for nullish coalescing
    );
    setMatrix(newMatrix);
    return { rows: validRows, cols: validCols }; // Return validated size
  }, []);

  // Handle size change input
  const handleSizeChange = (matrixType, dimension, value) => {
    const setSize = matrixType === 'A' ? setSizeA : setSizeB;
    const setMatrix = matrixType === 'A' ? setMatrixA : setMatrixB;
    const currentSize = matrixType === 'A' ? sizeA : sizeB;
    const currentMatrix = matrixType === 'A' ? matrixA : matrixB;

    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue <= 0) return; // Ignore invalid input

    const newSize = { ...currentSize, [dimension]: numValue };
    const validatedSize = adjustMatrixSize(setMatrix, currentMatrix, newSize);
    setSize(validatedSize); // Update size state with validated size
  };

  // Handle individual matrix cell changes
  const handleMatrixChange = (setMatrix, row, col, value) => {
    setMatrix((prevMatrix) => {
      const newMatrix = prevMatrix.map(r => [...r]); // Deep copy
      newMatrix[row][col] = parseFloat(value) || 0; // Use 0 if parsing fails
      return newMatrix;
    });
    setResult(null); // Clear result on input change
    setError('');
  };

  // Clear matrix to zeros
  const clearMatrix = (setMatrix, size) => {
    const { rows, cols } = size;
    const zeroMatrix = Array.from({ length: rows }, () => Array(cols).fill(0));
    setMatrix(zeroMatrix);
  };

  // --- Calculation Logic ---
  const calculate = (operation) => {
    setResult(null);
    setError('');
    setOperationInfo(`Result of: ${operation}`); // Set operation info

    try {
      let res = null;
      // --- Dimension Checks ---
      if (['add', 'subtract'].includes(operation)) {
        if (sizeA.rows !== sizeB.rows || sizeA.cols !== sizeB.cols) {
          throw new Error('Matrices must have the same dimensions for addition/subtraction.');
        }
      }
      if (operation === 'multiply' && sizeA.cols !== sizeB.rows) {
        throw new Error('Matrix A columns must match Matrix B rows for multiplication.');
      }
      if (['determinantA', 'inverseA', 'eigenA'].includes(operation) && sizeA.rows !== sizeA.cols) {
        throw new Error('Matrix A must be square for Determinant, Inverse, or Eigenvalues.');
      }
       if (['determinantB', 'inverseB', 'eigenB'].includes(operation) && sizeB.rows !== sizeB.cols) {
        throw new Error('Matrix B must be square for Determinant, Inverse, or Eigenvalues.');
      }

      // --- Perform Operation ---
      switch (operation) {
        case 'add':
          res = add(matrixA, matrixB);
          break;
        case 'subtract':
          res = subtract(matrixA, matrixB);
          break;
        case 'multiply':
          res = multiply(matrixA, matrixB);
          break;
        case 'scalarMultiplyA':
          res = scalarMultiply(matrixA, scalar);
          setOperationInfo(`Result of: ${scalar} * A`);
          break;
        case 'scalarMultiplyB':
          res = scalarMultiply(matrixB, scalar);
           setOperationInfo(`Result of: ${scalar} * B`);
          break;
        case 'transposeA':
          res = transpose(matrixA);
          break;
        case 'transposeB':
          res = transpose(matrixB);
          break;
        case 'determinantA':
          res = det(matrixA);
          break;
        case 'determinantB':
          res = det(matrixB);
          break;
        case 'inverseA':
          res = inv(matrixA);
          break;
        case 'inverseB':
          res = inv(matrixB);
          break;
        case 'eigenA':
        case 'eigenB':
          const matrixToUse = operation === 'eigenA' ? matrixA : matrixB;
          // Numeric.js might return complex numbers. Handle potential errors.
          try {
            const eigResult = numeric.eig(matrixToUse);
            // Check if eigenvalues or vectors are complex (numeric.js returns real/imag parts)
            const eigenvalues = eigResult.lambda.y ?
                eigResult.lambda.x.map((real, i) => numeric.complex(real, eigResult.lambda.y[i]))
                : eigResult.lambda.x;

            // Eigenvectors can also be complex
            const eigenvectors = eigResult.E.y ?
                numeric.transpose(eigResult.E.x).map((colReal, colIdx) =>
                    colReal.map((real, rowIdx) => numeric.complex(real, eigResult.E.y[colIdx][rowIdx]))
                )
                : numeric.transpose(eigResult.E.x); // Transpose to get vectors as columns

            res = {
              eigenvalues: eigenvalues.map(val => typeof val === 'object' ? val.toString() : formatNumber(val)), // Format complex/real numbers
              eigenvectors: eigenvectors // Display vectors as columns
            };
          } catch (eigError) {
             throw new Error(`Eigenvalue computation failed: ${eigError.message}`);
          }
          break;
        default:
          throw new Error('Unknown operation selected.');
      }
      setResult(res);
    } catch (error) {
      console.error("Calculation Error:", error);
      setError(error.message || 'Error performing operation. Check dimensions or values.');
    }
  };

  // Helper to render results appropriately
  const renderResult = () => {
    if (error) {
      return <p className="error-message">Error: {error}</p>;
    }
    if (result === null || result === undefined) {
      return <p>Perform an operation to see the result.</p>;
    }

    // Handle Eigenvalue/vector object
    if (typeof result === 'object' && !Array.isArray(result) && result.eigenvalues) {
      return (
        <div className="eigen-result">
          <h4>Eigenvalues:</h4>
          <div className="eigenvalues-list">
            {result.eigenvalues.map((val, index) => (
              <span key={`val-${index}`} className="eigenvalue">{val}</span>
            ))}
          </div>
          <h4>Eigenvectors (as columns):</h4>
          {/* Display eigenvectors using MatrixDisplay if they are purely real */}
          {/* For complex eigenvectors, MatrixDisplay might need adjustments or use preformatted text */}
           {Array.isArray(result.eigenvectors) && Array.isArray(result.eigenvectors[0]) ? (
               <MatrixDisplay matrix={result.eigenvectors} />
           ) : (
               <pre>{JSON.stringify(result.eigenvectors, null, 2)}</pre> // Fallback for complex or unexpected format
           )}
        </div>
      );
    }

    // Handle Matrix result
    if (Array.isArray(result)) {
      return <MatrixDisplay matrix={result} />;
    }

    // Handle Scalar result
    if (typeof result === 'number') {
      return <p className="scalar-result">{formatNumber(result)}</p>;
    }

    // Fallback for unexpected result types
    return <pre>{JSON.stringify(result, null, 2)}</pre>;
  };

  // Function to format numbers for display
  const formatNumber = (num) => {
      if (typeof num !== 'number') return num;
      // Add parentheses to clarify operator precedence
      if ((Math.abs(num) > 1e-6 && Math.abs(num) < 1e6) || num === 0) { 
          return parseFloat(num.toFixed(4));
      }
      return num.toExponential(3);
  };

  return (
    <div className="matrix-calculator">
      <h1>Matrix Calculator</h1>

      {/* Settings */}
      <div className="matrix-settings section">
        <h2>Settings</h2>
        <div className="size-controls">
          <div className="size-input">
            <label>Matrix A Size:</label>
            <input
              type="number" min="1" title="Rows A" aria-label="Matrix A Rows"
              value={sizeA.rows}
              onChange={(e) => handleSizeChange('A', 'rows', e.target.value)}
            /> x
            <input
              type="number" min="1" title="Columns A" aria-label="Matrix A Columns"
              value={sizeA.cols}
              onChange={(e) => handleSizeChange('A', 'cols', e.target.value)}
            />
            <button onClick={() => clearMatrix(setMatrixA, sizeA)} className="clear-button">Clear A</button>
          </div>
          <div className="size-input">
            <label>Matrix B Size:</label>
            <input
              type="number" min="1" title="Rows B" aria-label="Matrix B Rows"
              value={sizeB.rows}
              onChange={(e) => handleSizeChange('B', 'rows', e.target.value)}
            /> x
            <input
              type="number" min="1" title="Columns B" aria-label="Matrix B Columns"
              value={sizeB.cols}
              onChange={(e) => handleSizeChange('B', 'cols', e.target.value)}
            />
             <button onClick={() => clearMatrix(setMatrixB, sizeB)} className="clear-button">Clear B</button>
          </div>
           <div className="size-input scalar-input">
             <label htmlFor="scalarInput">Scalar:</label>
             <input
                id="scalarInput"
                type="number"
                step="any"
                value={scalar}
                onChange={(e) => setScalar(parseFloat(e.target.value) || 0)}
             />
           </div>
        </div>
      </div>

      {/* Inputs */}
      <div className="matrix-inputs section">
        <MatrixInputGrid
          matrix={matrixA}
          size={sizeA}
          onMatrixChange={(r, c, v) => handleMatrixChange(setMatrixA, r, c, v)}
          matrixLabel="Matrix A"
        />
        <MatrixInputGrid
          matrix={matrixB}
          size={sizeB}
          onMatrixChange={(r, c, v) => handleMatrixChange(setMatrixB, r, c, v)}
          matrixLabel="Matrix B"
        />
      </div>

      {/* Operations */}
      <div className="operations section">
        <h2>Operations</h2>
        <div className="buttons">
          {/* Basic Operations */}
          <button onClick={() => calculate('add')} title="A + B">Add</button>
          <button onClick={() => calculate('subtract')} title="A - B">Subtract</button>
          <button onClick={() => calculate('multiply')} title="A * B">Multiply</button>
          {/* Scalar Operations */}
           <button onClick={() => calculate('scalarMultiplyA')} title={`${scalar} * A`}>Scalar * A</button>
           <button onClick={() => calculate('scalarMultiplyB')} title={`${scalar} * B`}>Scalar * B</button>
          {/* Matrix A Operations */}
          <button onClick={() => calculate('transposeA')} title="Transpose(A)">Transpose A</button>
          <button onClick={() => calculate('determinantA')} title="det(A)">Determinant A</button>
          <button onClick={() => calculate('inverseA')} title="inv(A)">Inverse A</button>
          <button onClick={() => calculate('eigenA')} title="Eigenvalues/vectors(A)">Eigen A</button>
          {/* Matrix B Operations */}
          <button onClick={() => calculate('transposeB')} title="Transpose(B)">Transpose B</button>
          <button onClick={() => calculate('determinantB')} title="det(B)">Determinant B</button>
          <button onClick={() => calculate('inverseB')} title="inv(B)">Inverse B</button>
          <button onClick={() => calculate('eigenB')} title="Eigenvalues/vectors(B)">Eigen B</button>
        </div>
      </div>

      {/* Results */}
      <div className="results section">
        <h2>Result <span className="operation-info">{operationInfo ? `(${operationInfo})` : ''}</span></h2>
        {renderResult()}
      </div>
    </div>
  );
};

export default MatrixCalculator;
