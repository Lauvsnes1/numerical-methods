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

  const handleCalculate = async () => {
    console.log('data:', data);
    switch (polynomialDegree) {
      case 'one':
        const { a, b } = handleDegreeOne();
        setConstants([a, b]);
        setResult('y = ' + round(b, 4) + 'x +' + round(a, 4));
        break;
      case 'two':
        const { a_0, a_1, a_2 } = await handleDegreeTwo();
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

    //Initialize the matrix to solve with gauss-elimination to reduced row echolon form
    const tmpMatrix = [
      [numObservations, x_sum, x2_sum, y_sum],
      [x_sum, x2_sum, x3_sum, xy_sum],
      [x2_sum, x3_sum, x4_sum, x2y_sum],
    ];
    console.log('sending to API:', JSON.stringify({ matrix: tmpMatrix }));
    try {
      //we solve it from an api call
      const url = 'https://sympy-api-2.onrender.com/rref/';
      return fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matrix: tmpMatrix }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then((data) => {
          console.log('response from api: ', data.rref_matrix);
          if (data.rref_matrix) {
            const res = formatAPIResult(data.rref_matrix);
            const a_0 = res[0];
            const a_1 = res[1];
            const a_2 = res[2];
            return { a_0, a_1, a_2 };
          } else {
            console.log('No result from the API');
            return { a_0: 0, a_1: 0, a_2: 0 };
          }
        })
        .catch((error) => {
          console.error(`Fetch Error: ${error}`);
          return { a_0: 0, a_1: 0, a_2: 0 };
        });
    } catch (e) {
      alert('Equation not solvable');
      console.log(e);
      // Return default values if an error occurs
      return { a_0: 0, a_1: 0, a_2: 0 };
    }
  };

  //useEffect to update evaluated number
  useEffect(() => {
    if (evalNum !== undefined && constants) {
      //convert back to MathNode with simplify object to evaluate
      let equation: string | MathNode = '';
      //We set the equation with constants
      constants.length === 2
        ? (equation = `${constants[0]} + ${constants[1]} * x`)
        : (equation = `${constants[0]} + ${constants[1]} * x + ${constants[2]} * x^2`);

      //Simplify to make more readable
      equation = simplify(equation);
      //When user update desired point, we evaluate the equation in that point
      const evaluated: number = equation.evaluate({ x: evalNum });
      setEvalRes(round(evaluated, 4));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  //Helper function to extract last column in the reduced row echolon
  function formatAPIResult(matrixString: string): number[] {
    // Remove "Matrix(" and ")" from the string and parse it into an array
    const matrix = JSON.parse(matrixString.replace('Matrix(', '').replace(')', ''));

    // Map each row of the matrix to its last element
    const lastColumn = matrix.map((row: number[]) => row[row.length - 1]);
    return lastColumn;
  }

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
