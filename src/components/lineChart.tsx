import { Box, Typography } from '@mui/material';
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

const CustomLineChart = (props: { constants: number[]; dataPoints: DataRow[] }) => {
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
    if (props.constants.length === 2) {
      //case: degree 1
      const a = props.constants[0];
      const b = props.constants[1];
      const f = (x: number) => b * x + a;

      const lineData = Array.from({ length: maxX - minX + 1 }, (_, i) => ({
        x: minX + i,
        lineY: f(minX + i),
      }));

      mergeData(scatterData, lineData);
    } else if (props.constants.length === 3) {
      // case: degree 2
      const a_0 = props.constants[0];
      const a_1 = props.constants[1];
      const a_2 = props.constants[2];
      const f = (x: number) => a_0 + a_1 * x + a_2 * x ** 2;

      const lineData = Array.from({ length: maxX - minX + 1 }, (_, i) => ({
        x: minX + i,
        lineY: f(minX + i),
      }));

      mergeData(scatterData, lineData);
    }
  }, [props.constants, props.dataPoints]);

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

export default CustomLineChart;
