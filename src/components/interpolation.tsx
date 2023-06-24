import { Box, Button, TextField, Typography } from '@mui/material';
import { MathNode, number, round, simplify } from 'mathjs';
import React, { ChangeEvent, useEffect, useState } from 'react';
import InterpolationChart from './interPolationChart';

//Datarow is a row in input table
interface DataRow {
  x: number | null;
  y: number | null;
}

const Interpolation = () => {
  const [numObservations, setNumObservations] = useState(1);
  const [data, setData] = useState<DataRow[]>([{ x: null, y: null }]);
  const [resultString, setResultString] = useState<string>('');
  const [equation, setEquation] = useState<MathNode>();
  const [evalNum, setEvalNum] = useState<number>();
  const [evalResult, setEvalRes] = useState<number>();

  const handleCalculate = () => {
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

    //lets calculate the end product with algebraic calculator from mathjs
    let result = simplify(completeEquation);
    setEquation(result);

    //We call api with python SymPy to simplify algebra
    try {
      const expression = result.toString();
      //const encodedExpression = encodeURIComponent(expression);
      const url = `https://sympy-api-2.onrender.com/simplify/`;
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ expression: expression }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log('response from api: ', data.simplified_expression);
          return data;
        })
        .then((data) => formatAPIResult(data.simplified_expression));
      setEvalNum(0);
    } catch (e) {
      console.log(e);
      console.log('Could not hit API');
    }
  };

  useEffect(() => {
    if (evalNum !== undefined) {
      //When user update desired point, we evaluate the equation in that point
      const result: number = equation?.evaluate({ x: evalNum });
      setEvalRes(round(result, 4));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evalNum]);

  //----------------------------------------------------------------------

  const formatAPIResult = (resp: string) => {
    const roundedExpression = resp
      //.replace(/[-+]?\d*\.\d+|\d+/g, roundMatch)
      .replace(/\*\*2/g, '²')
      .replace(/\*\*3/g, '³')
      .replace(/\*\*4/g, '⁴')
      .replace(/\*\*5/g, '⁵')
      .replace(/\*\*6/g, '⁶')
      .replace(/\*/g, '·');
    setResultString(roundedExpression);
  };
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

  const handleEvalNumber = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const number = parseFloat(e.target.value);
    setEvalNum(number);
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
        //value={numObservations}
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
      {resultString && (
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
          </Box>
          <InterpolationChart equation={equation} dataPoints={data} />{' '}
        </Box>
      )}
    </Box>
  );
};
export default Interpolation;
