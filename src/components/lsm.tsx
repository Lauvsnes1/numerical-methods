import React, { useState, ChangeEvent, useEffect } from 'react';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import { Box, TextField, Typography } from '@mui/material';
import CostumLineChart from './regressionChart';
import { MathNode, round, simplify } from 'mathjs';

interface DataRow {
  x: number | null;
  y: number | null;
}

const LSM: React.FC = () => {
  const [numObservations, setNumObservations] = useState(1);
  // Initialize data with null values
  const [data, setData] = useState<DataRow[]>([{ x: null, y: null }]);
  const [polynomialDegree, setPolynomialDegree] = useState<string>('one');
  const [result, setResult] = useState<string>('');
  const [constants, setConstants] = useState<number[] | undefined>(undefined);
  const [evalNum, setEvalNum] = useState<number>();
  const [evalResult, setEvalRes] = useState<number>();

  const handleCalculate = () => {
    console.log('data:', data);
    switch (polynomialDegree) {
      case 'one':
        const { a, b } = handleDegreeOne();
        setConstants([a, b]);
        setResult('y = ' + round(b, 4) + 'x +' + round(a, 4));
        break;
      case 'two':
        const { a_0, a_1, a_2 } = handleDegreeTwo();
        setConstants([a_0, a_1, a_2]);
        setResult('y = ' + round(a_2, 4) + 'x\u00B2 + ' + round(a_1, 4) + 'x + ' + round(a_0, 4));

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
      if (row.x !== null && row.y !== null) {
        x_sum += row.x;
        y_sum += row.y;
        xy_sum += row.x * row.y;
        x2_sum += row.x * row.x;
      }
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
      if (row.x !== null && row.y !== null) {
        x_sum += row.x;
        y_sum += row.y;
        xy_sum += row.x * row.y;
        x2y_sum += row.x * row.x * row.y;
        x2_sum += row.x * row.x;
        x3_sum += row.x * row.x * row.x;
        x4_sum += row.x * row.x * row.x * row.x;
      }
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

  //useEffect to update evaluated number
  useEffect(() => {
    if (evalNum !== undefined && constants) {
      //convert back to MathNode with simplify object to evaluate
      let equation: string | MathNode = '';
      console.log('constants:', constants);
      constants.length === 2
        ? (equation = `${constants[0]} + ${constants[1]} * x`)
        : (equation = `${constants[0]} + ${constants[1]} * x + ${constants[2]} * x^2`);
      console.log('equation', equation, 'with type ', typeof equation);

      equation = simplify(equation);
      console.log('equation after', equation);
      //When user update desired point, we evaluate the equation in that point
      const evaluated: number = equation.evaluate({ x: evalNum });
      setEvalRes(round(evaluated, 4));
    }
  }, [evalNum]);
  // ---------------------------------------------------------------------

  const handleObservationsChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      const newNumObservations = parseInt(e.target.value);
      if (newNumObservations >= 1) {
        setNumObservations(newNumObservations);

        if (newNumObservations > data.length) {
          // if there are more observations than data points, add the difference
          const newData = [...data];
          for (let i = data.length; i < newNumObservations; i++) {
            newData.push({ x: 1, y: 1 });
          }
          setData(newData);
        } else {
          // if there are less observations than data points, remove the difference
          setData(data.slice(0, newNumObservations));
        }
      }
    }
  };

  const handleDataChange =
    (index: number, column: keyof DataRow) => (e: ChangeEvent<HTMLInputElement>) => {
      const newData = [...data];
      // Assign a default value of 0 when the input is empty
      newData[index][column] = e.target.value ? parseFloat(e.target.value) : null;
      setData(newData);
    };

  const handlePolyDegree = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    const degree = event.currentTarget.value;
    setPolynomialDegree(degree);
  };

  const handleEvalNumber = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const number = parseFloat(e.target.value);
    setEvalNum(number);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <Typography variant="h6">Number of observations:</Typography>
      <TextField
        id="outlined-number"
        type="number"
        //value={numObservations}
        onChange={handleObservationsChange}
        InputLabelProps={{
          shrink: true,
        }}
        sx={{ margin: 'auto' }}
      />
      <Typography variant="h6" sx={{ paddingTop: '20px' }}>
        Polynomial degree:
      </Typography>
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
      <Typography sx={{ paddingTop: '20px' }} variant="h6">
        Observations:
      </Typography>
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
                <input type="number" onChange={handleDataChange(i, 'x')} />
              </td>
              <td>
                <input type="number" onChange={handleDataChange(i, 'y')} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Button
        sx={{ margin: 'auto', marginTop: '20px' }}
        variant="contained"
        onClick={handleCalculate}
      >
        Calculate
      </Button>
      <TextField
        sx={{
          width: '60%',
          justifyContent: 'center',
          display: 'flex',
          margin: 'auto',
          marginTop: '20px',
        }}
        id="filled-basic"
        label="Result"
        variant="filled"
        value={result}
        InputProps={{
          readOnly: true,
        }}
      />
      {constants && (
        <Box>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              marginTop: '20px',
            }}
          >
            <TextField
              id="outlined-number"
              label="Evaluate in point:"
              type="number"
              onChange={handleEvalNumber}
              InputLabelProps={{
                shrink: true,
              }}
            />
            <TextField
              id="filled-basic"
              label="Result"
              variant="filled"
              value={`p(${evalNum}) = ${evalResult}`}
              InputProps={{
                readOnly: true,
              }}
            />
          </Box>{' '}
          <CostumLineChart constants={constants} dataPoints={data} />{' '}
        </Box>
      )}
    </div>
  );
};

export default LSM;
