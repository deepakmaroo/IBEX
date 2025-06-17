import { Layout } from 'plotly.js';
import { useEffect, useRef, useState } from 'react';
import Plot from 'react-plotly.js';
import { SimplePlotlyProps } from 'src/renderer/types';

export const SimplePlotly = ({
  title,
  xAxis,
  yAxis,
  y2Axis,
  data,
  isStatic,
  height,
  width,
}: SimplePlotlyProps) => {
  const [layoutPlot, setLayoutPlot] = useState<Partial<Layout>>({});
  const plotRef = useRef<Plot | null>(null);

  const handleRelayout = (newLayout: Partial<Layout>) => {
    setLayoutPlot((prevLayout) => ({
      ...prevLayout,
      ...newLayout, // update the layout with new values
    }));
  };

  /**
   * Update the layout of the plot
   */
  useEffect(() => {
    setLayoutPlot((prevLayout) => ({
      ...prevLayout,
      height: height,
      width: width,
      title: { text: title },
      xaxis: {
        ...prevLayout.xaxis,
        title: {
          text: xAxis.name,
          font: {
            family: 'Courier New, monospace',
            size: 18,
            color: '#7f7f7f',
          },
        },
        rangemode: 'tozero',
        showline: true,
      },
      yaxis: {
        ...prevLayout.yaxis,
        title: {
          text: yAxis.unit,
          font: {
            family: 'Courier New, monospace',
            size: 18,
            color: '#7f7f7f',
          },
        },
        showline: true,
        rangemode: 'tozero',
      },
      modebar: {
        orientation: 'v',
      },
      legend: {
        x: 1.1,
        y: 1,
        orientation: 'v',
      },
      yaxis2:
        y2Axis && y2Axis !== undefined
          ? {
              title: {
                text: y2Axis.unit,
                font: {
                  family: 'Courier New, monospace',
                  size: 18,
                  color: 'rgb(148, 103, 189)',
                },
              },
              tickfont: { color: 'rgb(148, 103, 189)' },
              overlaying: 'y',
              side: 'right',
            }
          : {},
      showline: true,
      rangemode: 'tozero',
      plot_bgcolor: '#c7c7c7',
      // paper_bgcolor: "#c8b8b8",
      dragmode: 'zoom',
    }));
  }, [title, xAxis, yAxis, height, width]);

  return (
    <Plot
      ref={plotRef}
      data={data}
      layout={layoutPlot}
      onRelayout={handleRelayout}
      config={{
        autosizable: false,
        staticPlot: !isStatic,
        scrollZoom: true,
        displayModeBar: true,
        showTips: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['lasso2d', 'select2d']
      }}
      useResizeHandler={false}
      style={{ width: '100%', height: '100%' }}
      
    />
  );
};
