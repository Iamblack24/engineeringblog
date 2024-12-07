import React, { useState } from 'react';
import { add, subtract, multiply, transpose, det, inv } from 'mathjs';
import numeric from 'numeric'; // For eigenvalue and eigenvector computation
import './MatrixCalculator.css';

const MatrixCalculator = () => {
  const [matrixA, setMatrixA] = useState([[0, 0], [0, 0]]);
  const [matrixB, setMatrixB] = useState([[0, 0], [0, 0]]);
  const [result, setResult] = useState(null);
  const [sizeA, setSizeA] = useState({ rows: 2, cols: 2 });
  const [sizeB, setSizeB] = useState({ rows: 2, cols: 2 });

  const adjustMatrixSize = (setMatrix, size) => {
    const { rows, cols } = size;
    setMatrix((prevMatrix) => {
      const newMatrix = Array.from({ length: rows }, (_, i) =>
        Array.from({ length: cols }, (_, j) => (prevMatrix[i]?.[j] || 0))
      );
      return newMatrix;
    });
  };

  const handleMatrixChange = (matrix, setMatrix, row, col, value) => {
    const newMatrix = [...matrix];
    newMatrix[row][col] = parseFloat(value) || 0;
    setMatrix(newMatrix);
  };

  const calculate = (operation) => {
    try {
      let res = null;
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
        case 'transposeA':
          res = transpose(matrixA);
          break;
        case 'transposeB':
          res = transpose(matrixB);
          break;
        case 'determinantA':
          res = det(matrixA);
          break;
        case 'inverseA':
          res = inv(matrixA);
          break;
        case 'eigenA':
          const eigResult = numeric.eig(matrixA);
          res = {
            eigenvalues: eigResult.lambda.x,
            eigenvectors: eigResult.E.x,
          };
          break;
        default:
          res = null;
      }
      setResult(res);
    } catch (error) {
      alert('Error performing matrix operation. Check dimensions or values!');
    }
  };

  const renderMatrix = (matrix) => (
    <table>
      <tbody>
        {matrix.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((value, colIndex) => (
              <td key={colIndex}>{value}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="matrix-calculator">
      <h1>Expanded Matrix Calculator</h1>
      <div className="matrix-settings">
        <h2>Matrix Size</h2>
        <label>
          Matrix A: Rows
          <input
            type="number"
            value={sizeA.rows}
            onChange={(e) => {
              const newSize = { ...sizeA, rows: parseInt(e.target.value) || 1 };
              setSizeA(newSize);
              adjustMatrixSize(setMatrixA, newSize);
            }}
          />
          Columns
          <input
            type="number"
            value={sizeA.cols}
            onChange={(e) => {
              const newSize = { ...sizeA, cols: parseInt(e.target.value) || 1 };
              setSizeA(newSize);
              adjustMatrixSize(setMatrixA, newSize);
            }}
          />
        </label>
        <label>
          Matrix B: Rows
          <input
            type="number"
            value={sizeB.rows}
            onChange={(e) => {
              const newSize = { ...sizeB, rows: parseInt(e.target.value) || 1 };
              setSizeB(newSize);
              adjustMatrixSize(setMatrixB, newSize);
            }}
          />
          Columns
          <input
            type="number"
            value={sizeB.cols}
            onChange={(e) => {
              const newSize = { ...sizeB, cols: parseInt(e.target.value) || 1 };
              setSizeB(newSize);
              adjustMatrixSize(setMatrixB, newSize);
            }}
          />
        </label>
      </div>
      <div className="matrix-inputs">
        <div>
          <h2>Matrix A</h2>
          {matrixA.map((row, rowIndex) => (
            <div key={rowIndex}>
              {row.map((value, colIndex) => (
                <input
                  key={colIndex}
                  type="number"
                  value={value}
                  onChange={(e) =>
                    handleMatrixChange(matrixA, setMatrixA, rowIndex, colIndex, e.target.value)
                  }
                />
              ))}
            </div>
          ))}
        </div>
        <div>
          <h2>Matrix B</h2>
          {matrixB.map((row, rowIndex) => (
            <div key={rowIndex}>
              {row.map((value, colIndex) => (
                <input
                  key={colIndex}
                  type="number"
                  value={value}
                  onChange={(e) =>
                    handleMatrixChange(matrixB, setMatrixB, rowIndex, colIndex, e.target.value)
                  }
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="buttons">
        <button onClick={() => calculate('add')}>Add</button>
        <button onClick={() => calculate('subtract')}>Subtract</button>
        <button onClick={() => calculate('multiply')}>Multiply</button>
        <button onClick={() => calculate('transposeA')}>Transpose A</button>
        <button onClick={() => calculate('transposeB')}>Transpose B</button>
        <button onClick={() => calculate('determinantA')}>Determinant A</button>
        <button onClick={() => calculate('inverseA')}>Inverse A</button>
        <button onClick={() => calculate('eigenA')}>Eigenvalues A</button>
      </div>
      <div className="results">
        <h2>Result</h2>
        {result ? (
          typeof result === 'object' && !Array.isArray(result) ? (
            <pre>{JSON.stringify(result, null, 2)}</pre>
          ) : Array.isArray(result) ? (
            renderMatrix(result)
          ) : (
            <p>{result}</p>
          )
        ) : (
          <p>No result yet</p>
        )}
      </div>
    </div>
  );
};

export default MatrixCalculator;
