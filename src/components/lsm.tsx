import React, { useState, ChangeEvent } from 'react';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import { TextField, Typography } from '@mui/material';

interface DataRow {
  x: number;
  y: number;
}

const LSM: React.FC = () => {
  const [numObservations, setNumObservations] = useState(1);
  const [data, setData] = useState<DataRow[]>([{ x: 1, y: 1 }]);
  const [polynomialDegree, setPolynomialDegree] = useState<string>('one');
  const [result, setResult] = useState<string>('');

  const handleCalculate = () => {
    console.log('data:', data);
    switch (polynomialDegree) {
      case 'one':
        const { a, b } = handleDegreeOne();
        console.log(a, b);
        setResult('y = ' + b + 'x +' + a);
        break;
      case 'two':
        const { a_0, a_1, a_2 } = handleDegreeTwo();
        setResult('y = ' + a_2 + 'x^2 + ' + a_1 + 'x + ' + a_0);

        break;
    }
  };

  const handleDegreeOne = () => {
    let x_sum = 0;
    let y_sum = 0;
    let xy_sum = 0;
    let x2_sum = 0;
    //We calculate the sums
    data.forEach((row: DataRow) => {
      x_sum += row.x;
      y_sum += row.y;
      xy_sum += row.x * row.y;
      x2_sum += row.x * row.x;
    });
    //Find the constants from the formula:
    const a = (x2_sum * y_sum - x_sum * xy_sum) / (numObservations * x2_sum - x_sum * x_sum);
    const b =
      (numObservations * xy_sum - x_sum * y_sum) / (numObservations * x2_sum - x_sum * x_sum);
    return { a, b };
  };

  const handleDegreeTwo = () => {
    let x_sum = 0;
    let y_sum = 0;
    let xy_sum = 0;
    let x2y_sum = 0;
    let x2_sum = 0;
    let x3_sum = 0;
    let x4_sum = 0;
    //We calculate the sums
    data.forEach((row: DataRow) => {
      x_sum += row.x;
      y_sum += row.y;
      xy_sum += row.x * row.y;
      x2y_sum += row.x * row.x * row.y;
      x2_sum += row.x * row.x;
      x3_sum += row.x * row.x * row.x;
      x4_sum += row.x * row.x * row.x * row.x;
    });

    //Initialize the matrix to solve with gauss-jordan
    const tmpMatrix = [
      [numObservations, x_sum, x2_sum, y_sum],
      [x_sum, x2_sum, x3_sum, xy_sum],
      [x2_sum, x3_sum, x4_sum, x2y_sum],
    ];
    try {
      const res = gaussianElimination(tmpMatrix);
      console.log('res:', res);
      if (res) {
        const a_0 = res[0];
        const a_1 = res[1];
        const a_2 = res[2];
        return { a_0, a_1, a_2 };
      } else {
        // Return default values if `res` is undefined
        return { a_0: 0, a_1: 0, a_2: 0 };
      }
    } catch (e) {
      alert('Equation not solvable');
      console.log(e);
      // Return default values if an error occurs
      return { a_0: 0, a_1: 0, a_2: 0 };
    }
  };

  //We need to solve the linear equation system, so implemented Gaussian elimination
  //not made by me
  function gaussianElimination(matrix: number[][]): number[] | undefined {
    let n = matrix.length;

    for (let i = 0; i < n; i++) {
      // Find maximum in column
      let maxEl = Math.abs(matrix[i][i]),
        maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(matrix[k][i]) > maxEl) {
          maxEl = Math.abs(matrix[k][i]);
          maxRow = k;
        }
      }

      // Swap maximum row with current row
      let tmp = matrix[maxRow];
      matrix[maxRow] = matrix[i];
      matrix[i] = tmp;

      // No solutions if matrix[i][i] == 0
      if (matrix[i][i] === 0) return undefined;

      for (let k = i + 1; k < n; k++) {
        let factor = matrix[k][i] / matrix[i][i];
        for (let j = i; j < n + 1; j++) {
          if (i === j) {
            matrix[k][j] = 0;
          } else {
            matrix[k][j] -= factor * matrix[i][j];
          }
        }
      }
    }

    // Solve equation for an upper triangular matrix
    let x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      x[i] = matrix[i][n] / matrix[i][i];
      for (let k = i - 1; k >= 0; k--) {
        matrix[k][n] -= matrix[k][i] * x[i];
      }
    }
    return x;
  }

  const handleObservationsChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newNumObservations = parseInt(e.target.value);
    setNumObservations(newNumObservations);

    setData(Array.from({ length: newNumObservations }, () => ({ x: 1, y: 1 })));
  };

  const handleDataChange =
    (index: number, column: keyof DataRow) => (e: ChangeEvent<HTMLInputElement>) => {
      const newData = [...data];
      newData[index][column] = parseInt(e.target.value);
      setData(newData);
    };

  const handlePolyDegree = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    const degree = event.currentTarget.value;
    setPolynomialDegree(degree);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <label>
        Number of Observations:
        <input type="number" value={numObservations} onChange={handleObservationsChange} />
      </label>
      <Typography>Polynomial degree:</Typography>
      <ButtonGroup
        sx={{ display: 'flex', justifyContent: 'center' }}
        aria-label="outlined primary button group"
      >
        <Button
          onClick={handlePolyDegree}
          variant={polynomialDegree === 'one' ? 'contained' : 'outlined'}
          value="one"
        >
          One
        </Button>
        <Button
          variant={polynomialDegree === 'two' ? 'contained' : 'outlined'}
          onClick={handlePolyDegree}
          value="two"
        >
          Two
        </Button>
      </ButtonGroup>

      <table style={{ marginLeft: 'auto', marginRight: 'auto' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>X</th>
            <th style={{ textAlign: 'left' }}>Y</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              <td>
                <input type="number" value={row.x} onChange={handleDataChange(i, 'x')} />
              </td>
              <td>
                <input type="number" value={row.y} onChange={handleDataChange(i, 'y')} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Button sx={{ margin: 'auto' }} onClick={handleCalculate}>
        Calculate
      </Button>
      <TextField
        id="filled-basic"
        label="Result"
        variant="filled"
        value={result}
        InputProps={{
          readOnly: true,
        }}
      />
    </div>
  );
};

export default LSM;
