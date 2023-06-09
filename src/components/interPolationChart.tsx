import { Box, Typography } from '@mui/material';
import { MathNode, simplify } from 'mathjs';
import React, { useEffect, useState } from 'react';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Scatter,
} from 'recharts';

interface DataRow {
  x: number | null;
  y: number | null;
}

const InterpolationChart = (props: { equation: MathNode | undefined; dataPoints: DataRow[] }) => {
  const [data, setData] = useState<{ scatterY: number | null; x: number; lineY: number }[]>([]);
  const [xAxisDomain, setXAxisDomain] = useState<[number, number]>([0, 0]);

  const mergeData = (
    scatterData: {
      x: number;
      scatterY: number;
    }[],
    lineData: {
      x: number;
      lineY: number;
    }[]
  ) => {
    const mergedData = lineData.map((linePoint) => {
      const correspondingScatterPoint = scatterData.find(
        (scatterPoint) => scatterPoint.x === linePoint.x
      );
      return { ...linePoint, scatterY: correspondingScatterPoint?.scatterY || null };
    });
    setData(mergedData);
  };

  useEffect(() => {
    //Make the points on desired form
    const scatterData = props.dataPoints
      .filter((point) => point.x !== null && point.y !== null)
      .map((point) => ({ x: point.x!, scatterY: point.y! }));

    // calculate min and max x-values for the domain in chart
    const minX = Math.min(...scatterData.map((data) => data.x)) - 2;
    const maxX = Math.max(...scatterData.map((data) => data.x)) + 2;

    setXAxisDomain([minX, maxX]);

    //Calculate the generated polynomial:
    if (props.equation) {
      const mathEquation = simplify(props.equation); //Convert back to MathNode object with simplify()
      //We evaluate in a given number of points
      const step = 0.5;
      const lineData = Array.from({ length: Math.ceil((maxX - minX) / step) }, (_, i) => {
        const x = minX + i * step;
        return {
          x: x,
          lineY: mathEquation.evaluate({ x: x }),
        };
      });

      mergeData(scatterData, lineData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.equation]);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '20px',
      }}
    >
      <Typography variant="h6">Visualization:</Typography>
      <ComposedChart
        width={700}
        height={300}
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        style={{ paddingTop: '20px' }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="x" domain={xAxisDomain} />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="lineY" stroke="#8884d8" dot={false} name="y" />
        <Scatter dataKey="scatterY" fill="#ff7300" name="observations" />
      </ComposedChart>
    </Box>
  );
};

export default InterpolationChart;
