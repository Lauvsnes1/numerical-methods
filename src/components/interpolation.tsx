import { Box, Button, TextField, Typography } from '@mui/material';
import { MathNode, number, rationalize, round, simplify } from 'mathjs';
import React, { ChangeEvent, useState } from 'react';
import InterpolationChart from './interPolationChart';

interface DataRow {
  x: number | null;
  y: number | null;
}

const Interpolation = () => {
  const [numObservations, setNumObservations] = useState(1);
  // Initialize data with null values
  const [data, setData] = useState<DataRow[]>([{ x: null, y: null }]);
  const [resultString, setResultString] = useState<string>('');
  const [equation, setEquation] = useState<MathNode>();

  const handleCalculate = () => {
    console.log('Data: ', data);
    let completeEquation: string = '';
    //go though each data row
    for (let i = 0; i < data.length; i++) {
      let numerator = '';
      let denominator: number = 1;
      for (let j = 0; j < data.length; j++) {
        if (data[i].x !== null && data[j].x !== null) {
          if (i !== j) {
            //generate numerator
            numerator += '(x - ' + data[j].x + ')';
            //calculate the denominator
            const value = simplify(`${data[i].x}  -  ${data[j].x} `).toString();
            denominator *= number(value);
          }
        }
      }
      completeEquation += `+ (${numerator}  / ${denominator}) * ${data[i].y}`;
    }
    console.log('Complete equation:', completeEquation);

    //lets calculate the end product with algebraic calculator from mathjs
    let result = simplify(completeEquation);
    console.log('simplified result:', result.toString());
    setEquation(result);
    //If expression is small, we can rationalize the answer to more readable polynomial
    if (numObservations < 4) {
      try {
        result = rationalize(result);
      } catch (e) {
        console.log(e);
        console.log('could not rationalize');
      }
    }
    formatResult(result);
  };

  //----------------------------------------------------------------------

  const formatResult = (result: MathNode) => {
    let expression = result.toString();
    const roundMatch = (match: string): string => String(round(parseFloat(match), 4));
    const roundedExpression = expression
      .replace(/[-+]?\d*\.\d+|\d+/g, roundMatch)
      .replace(/\^ 2/g, '²')
      .replace(/\^ 3/g, '³')
      .replace(/\^ 4/g, '⁴')
      .replace(/\^ 5/g, '⁵')
      .replace(/\^ 6/g, '⁶')
      .replace(/\*/g, '·');
    setResultString(roundedExpression);
  };
  const handleObservationsChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      const newNumObservations = parseInt(e.target.value);
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
  };

  const handleDataChange =
    (index: number, column: keyof DataRow) => (e: ChangeEvent<HTMLInputElement>) => {
      const newData = [...data];
      // Assign a default value of 0 when the input is empty
      newData[index][column] = e.target.value ? parseFloat(e.target.value) : null;
      setData(newData);
    };
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <Typography variant="h6">Number of observations:</Typography>
      <TextField
        id="outlined-number"
        type="number"
        value={numObservations}
        onChange={handleObservationsChange}
        InputLabelProps={{
          shrink: true,
        }}
        sx={{ margin: 'auto' }}
      />
      <Typography sx={{ paddingTop: '20px' }} variant="h6">
        Observations:
      </Typography>
      <table style={{ marginLeft: 'auto', marginRight: 'auto' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>X</th>
            <th style={{ textAlign: 'left' }}>f(x)</th>
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
        value={`p(x) = ${resultString}`}
        InputProps={{
          readOnly: true,
        }}
      />
      {resultString && <InterpolationChart equation={equation} dataPoints={data} />}
    </Box>
  );
};
export default Interpolation;
