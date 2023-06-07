import * as React from 'react';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import { Button, MenuItem, Select, SelectChangeEvent, Typography } from '@mui/material';
import { round } from 'mathjs';

const MatrixInput: React.FC = () => {
  const [numberOfUnknowns, setNumberOfUnknowns] = React.useState<number>(2);
  const [matrix, setMatrix] = React.useState<number[][]>([]);
  const [result, setResult] = React.useState<number[]>([]);

  const handleCalculate = () => {
    //let tempMatrix = matrix;

    const EPSILON = 1e-5; // Precision threshold
    const MAX_ITERATIONS = 100; // Avoid infinite loop

    let n = matrix.length;
    // Initial guess of 0's
    let x = new Array(n).fill(0);

    for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
      let x_new = Array.from(x); // Copy of solution

      for (let i = 0; i < n; i++) {
        let sum = matrix[i][n]; // The constant on the RHS of the equation

        for (let j = 0; j < n; j++) {
          if (i !== j) {
            sum -= matrix[i][j] * x[j];
          }
        }

        // Update the value of our solution
        x_new[i] = sum / matrix[i][i];
      }

      // Compute the difference between two iterations(for convergence)
      let diff = x_new.map((val, idx) => Math.abs(val - x[idx]));

      // Check for convergence
      if (Math.max(...diff) < EPSILON) {
        console.log(`Converged after ${iter + 1} iterations`);
        break;
      }

      x = x_new;
    }
    x = x.map((result) => {
      return round(result, 4);
    });

    console.log('solution:', x);
    setResult(x);
  };

  // useEffect to update matrix size when numberOfUnknowns changes
  React.useEffect(() => {
    setMatrix(
      new Array(numberOfUnknowns).fill(0).map(() => new Array(numberOfUnknowns + 1).fill(0))
    );
  }, [numberOfUnknowns]);

  const handleUnknownsChange = (event: SelectChangeEvent<number>) => {
    const value = parseInt(event.target.value as string, 10);
    setNumberOfUnknowns(value);
  };

  const handleMatrixChange =
    (row: number, col: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const newMatrix = [...matrix];
      newMatrix[row][col] = parseFloat(event.target.value);
      setMatrix(newMatrix);
    };

  return (
    <Box sx={{ m: 2, display: 'flex', flexDirection: 'column' }}>
      <Typography>Number of unknowns:</Typography>
      <Select
        labelId="unknowns-label"
        value={numberOfUnknowns}
        onChange={handleUnknownsChange}
        sx={{ margin: 'auto' }}
      >
        {[2, 3, 4, 5, 6, 7].map((option: number) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </Select>
      <Typography>Your matrix:</Typography>

      <Grid container spacing={2} sx={{ mt: 2 }}>
        {matrix.map((row, i) =>
          row.map((value, j) => (
            //Asure we get correct representation of matrix
            <Grid item key={`cell-${i}-${j}`} xs={12 / (numberOfUnknowns + 1)}>
              <TextField
                type="number"
                label={`[${i + 1},${j + 1}]`}
                value={value}
                onChange={handleMatrixChange(i, j)}
              />
            </Grid>
          ))
        )}
      </Grid>
      <Button sx={{ margin: 'auto' }} onClick={handleCalculate}>
        Calculate
      </Button>
      <Grid container spacing={2} sx={{ mt: 2 }}>
        {result.map((res, index) => (
          <Grid item xs={12}>
            <TextField
              label={`X_${index}`}
              value={res}
              InputProps={{
                readOnly: true,
              }}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default MatrixInput;
