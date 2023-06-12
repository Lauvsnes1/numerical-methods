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
    let tempMatrix: number[][] | null = matrix;

    const EPSILON = 1e-4; // Precision threshold
    const MAX_ITERATIONS = 100; // Avoid infinite loop

    let n = tempMatrix.length;
    // Initial guess of 0's
    let x = new Array(n).fill(0);

    tempMatrix = handleRearrangeBruteForce(matrix);

    if (tempMatrix) {
      for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
        let x_new = Array.from(x); // Copy of solution

        for (let i = 0; i < n; i++) {
          let sum = tempMatrix[i][n];

          for (let j = 0; j < n; j++) {
            if (i !== j) {
              sum -= tempMatrix[i][j] * x[j];
            }
          }
          // Update the value of our solution
          x_new[i] = sum / tempMatrix[i][i];
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
    }
    console.log('solution:', x);
    //Round solution 2 4 decimals
    x = x.map((result) => {
      return round(result, 4);
    });

    if (x[0] && x[1]) {
      setResult(x);
    }
  };

  const isDiagonallyDominant = (matrix: number[][]): boolean => {
    const n = matrix.length;
    //Compute the gauss-seidel steps
    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          //calculate sum for all cells not in diagonal
          sum += Math.abs(matrix[i][j]);
        }
      }
      //Check if absolute value of diagonal is strictly smaller than the sum
      if (Math.abs(matrix[i][i]) < sum) {
        return false;
      }
    }
    return true;
  };

  // Helper function to generate all permutations of an array
  function permute<T>(arr: T[]): T[][] {
    if (arr.length <= 1) return [arr];
    let result: T[][] = [];
    for (let i = 0; i < arr.length; i++) {
      const rest = arr.slice(0, i).concat(arr.slice(i + 1));
      const perms = permute(rest);
      result = result.concat(perms.map((p) => [arr[i]].concat(p)));
    }
    return result;
  }

  const handleRearrangeBruteForce = (matrix: number[][]): number[][] | null => {
    const n = matrix.length;
    const submatrix: number[][] = matrix.map((row) => row.slice(0, n));
    if (isDiagonallyDominant(submatrix)) {
      return matrix;
    }

    // Generate all permutations of rows
    const permutations = permute(matrix);
    console.log('Permutations:', permutations);

    for (let p of permutations) {
      // remove last column to send square matrix for check
      const submatrix: number[][] = p.map((row) => row.slice(0, n));
      if (isDiagonallyDominant(submatrix)) {
        // If this permutation is diagonally dominant, return
        return p;
      }
    }
    console.log('No solvable matrix found due to diagonal indominance');
    alert('No solvable matrix found due to diagonal indominance');
    return null;
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
      <Typography variant="h6">Number of unknowns:</Typography>
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
      <Typography sx={{ paddingTop: '20px' }} variant="h6">
        Your matrix:
      </Typography>

      <Grid container spacing={2} sx={{ mt: 2 }}>
        {matrix.map((row, i) =>
          row.map((value, j) => (
            //Asure we get correct representation of matrix
            <Grid item key={`cell-${i}-${j}`} xs={12 / (numberOfUnknowns + 1)}>
              <TextField
                type="number"
                label={`[${i + 1},${j + 1}]`}
                //value={value}
                onChange={handleMatrixChange(i, j)}
              />
            </Grid>
          ))
        )}
      </Grid>
      <Button
        variant="contained"
        sx={{ margin: 'auto', marginTop: '20px' }}
        onClick={handleCalculate}
      >
        Calculate
      </Button>
      <Grid container spacing={2} sx={{ mt: 2 }}>
        {result.map((res, index) => (
          <Grid item xs={12} key={index}>
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
