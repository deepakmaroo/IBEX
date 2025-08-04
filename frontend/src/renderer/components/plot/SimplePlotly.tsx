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
  const [layoutPlot, setLayoutPlot] = useState<Partial<Layout>>({
    xaxis: {
      title: {
        font: {
          family: 'Courier New, monospace',
          size: 18,
          color: '#7f7f7f',
        },
      },
      rangemode: 'tozero',
      showline: true,
      zeroline: false,
    },
    yaxis: {
      title: {
        font: {
          family: 'Courier New, monospace',
          size: 18,
          color: '#7f7f7f',
        },
      },
      rangemode: 'tozero',
      showline: true,
      zeroline: false,
      showgrid: true,
    },
    modebar: {
      orientation: 'v',
    },
    legend: {
      x: 1.1,
      y: 1,
      orientation: 'v',
    },
    plot_bgcolor: '#c7c7c7',
    dragmode: 'zoom',
  });
  const plotRef = useRef<Plot | null>(null);

  const handleRelayout = (newLayout: Partial<Layout>) => {
    setLayoutPlot((prevLayout) => ({
      ...prevLayout,
      ...newLayout, // update the layout with new values
    }));
  };

  /**
   * Update the layout title
   */
  useEffect(() => {
    setLayoutPlot((prevLayout) => ({
      ...prevLayout,
      title: { text: title },
    }));
  }, [title]);

  /**
   * Update the layout height
   */
  useEffect(() => {
    setLayoutPlot((prevLayout) => ({
      ...prevLayout,
      height: height,
    }));
  }, [height]);

  /**
   * Update the layout width
   */
  useEffect(() => {
    setLayoutPlot((prevLayout) => ({
      ...prevLayout,
      width: width,
    }));
  }, [width]);

  /**
   * Update the layout yAxis
   */
  useEffect(() => {
    setLayoutPlot((prevLayout) => ({
      ...prevLayout,
      yaxis: {
        ...prevLayout.yaxis,
        title: {
          ...prevLayout.yaxis.title,
          text: yAxis?.unit || '',
        },
      },
    }));
  }, [yAxis]);

  /**
   * Update the layout xAxis
   */
  useEffect(() => {
    setLayoutPlot((prevLayout) => ({
      ...prevLayout,
      xaxis: {
        ...prevLayout.xaxis,
        title: {
          ...prevLayout.xaxis.title,
          text: xAxis?.name || '',
        },
      },
    }));
  }, [xAxis]);

  /**
   * Update the layout y2Axis
   */
  useEffect(() => {
    setLayoutPlot((prevLayout) => ({
      ...prevLayout,
      yaxis2:
        y2Axis && y2Axis !== undefined
          ? {
              title: {
                text: y2Axis?.unit || '',
                font: {
                  family: 'Courier New, monospace',
                  size: 18,
                  color: 'rgb(148, 103, 189)',
                },
              },
              tickfont: { color: 'rgb(148, 103, 189)' },
              overlaying: 'y',
              side: 'right',
              rangemode: 'tozero',
              showline: false,
              zeroline: false,
              showgrid: false,
            }
          : {},
    }));
  }, [y2Axis]);

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
        modeBarButtonsToRemove: ['lasso2d', 'select2d'],
      }}
      useResizeHandler={false}
      style={{ width: '100%', height: '100%' }}
    />
  );
};
