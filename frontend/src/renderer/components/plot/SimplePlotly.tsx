import { Layout } from 'plotly.js';
import { useEffect, useRef, useState } from 'react';
import Plot from 'react-plotly.js';
import { SimplePlotlyProps } from 'src/renderer/types';


export const SimplePlotly = ({
  title,
  xAxisName,
  yAxisName,
  y2AxisName,
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
      ...newLayout, // Merge le nouveau layout avec l'existant
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
          text: xAxisName,
          font: {
            family: 'Courier New, monospace',
            size: 18,
            color: '#7f7f7f',
          },
        },
        showline: true,
      },
      yaxis: {
        ...prevLayout.yaxis,
        title: {
          text: yAxisName,
          font: {
            family: 'Courier New, monospace',
            size: 18,
            color: '#7f7f7f',
          },
        },
        showline: true,
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
        y2AxisName && y2AxisName !== ''
          ? {
              title: {
                text: y2AxisName,
                font: {
                  family: 'Courier New, monospace',
                  size: 18,
                  color: 'rgb(148, 103, 189)',
                },
              },
              tickfont: { color: 'rgb(148, 103, 189)' },
              overlaying: 'y',
              side: 'right',
              showline: true,
              zeroline: false,
            }
          : {},
      showlegend: true,
      plot_bgcolor: '#c7c7c7',
      dragmode: 'zoom',
    }));
  }, [title, xAxisName, yAxisName, height, width]);

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
      }}
      useResizeHandler={false}
      style={{ width: '100%', height: '100%' }}
    />
  );
};
