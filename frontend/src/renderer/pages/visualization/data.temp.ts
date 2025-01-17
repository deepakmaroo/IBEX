import { TreeNodeData } from '@mantine/core';
import { CustomTreeData, IDSData } from 'src/renderer/types';

const data1: TreeNodeData[] = [
  {
    label: 'src',
    value: 'src',
    children: [
      {
        label: 'components',
        value: 'src/components',
        children: [
          { label: 'Accordion.tsx', value: 'src/components/Accordion.tsx' },
          { label: 'Tree.tsx', value: 'src/components/Tree.tsx' },
          { label: 'Button.tsx', value: 'src/components/Button.tsx' },
        ],
      },
    ],
  },
  {
    label: 'node_modules',
    value: 'node_modules',
    children: [
      {
        label: 'react',
        value: 'node_modules/react',
        children: [
          { label: 'index.d.ts', value: 'node_modules/react/index.d.ts' },
          { label: 'package.json', value: 'node_modules/react/package.json' },
        ],
      },
      {
        label: '@mantine',
        value: 'node_modules/@mantine',
        children: [
          {
            label: 'core',
            value: 'node_modules/@mantine/core',
            children: [
              {
                label: 'index.d.ts',
                value: 'node_modules/@mantine/core/index.d.ts',
              },
              {
                label: 'package.json',
                value: 'node_modules/@mantine/core/package.json',
              },
            ],
          },
          {
            label: 'hooks',
            value: 'node_modules/@mantine/hooks',
            children: [
              {
                label: 'index.d.ts',
                value: 'node_modules/@mantine/hooks/index.d.ts',
              },
              {
                label: 'package.json',
                value: 'node_modules/@mantine/hooks/package.json',
              },
            ],
          },
          {
            label: 'form',
            value: 'node_modules/@mantine/form',
            children: [
              {
                label: 'index.d.ts',
                value: 'node_modules/@mantine/form/index.d.ts',
              },
              {
                label: 'package.json',
                value: 'node_modules/@mantine/form/package.json',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    label: 'package.json',
    value: 'package.json',
  },
  {
    label: 'tsconfig.json',
    value: 'tsconfig.json',
  },
];

const data2: TreeNodeData[] = [
  {
    label: 'src',
    value: 'src',
    children: [
      {
        label: 'components',
        value: 'src/components',
        children: [
          { label: 'Accordion.tsx', value: 'src/components/Accordion.tsx' },
          { label: 'Tree.tsx', value: 'src/components/Tree.tsx' },
          { label: 'Button.tsx', value: 'src/components/Button.tsx' },
        ],
      },
    ],
  },
  {
    label: 'node_modules',
    value: 'node_modules',
    children: [
      {
        label: 'react',
        value: 'node_modules/react',
        children: [
          { label: 'index.d.ts', value: 'node_modules/react/index.d.ts' },
          { label: 'package.json', value: 'node_modules/react/package.json' },
        ],
      },
      {
        label: '@mantine',
        value: 'node_modules/@mantine',
        children: [
          {
            label: 'core',
            value: 'node_modules/@mantine/core',
            children: [
              {
                label: 'index.d.ts',
                value: 'node_modules/@mantine/core/index.d.ts',
              },
              {
                label: 'package.json',
                value: 'node_modules/@mantine/core/package.json',
              },
            ],
          },
          {
            label: 'hooks',
            value: 'node_modules/@mantine/hooks',
            children: [
              {
                label: 'index.d.ts',
                value: 'node_modules/@mantine/hooks/index.d.ts',
              },
              {
                label: 'package.json',
                value: 'node_modules/@mantine/hooks/package.json',
              },
            ],
          },
          {
            label: 'form',
            value: 'node_modules/@mantine/form',
            children: [
              {
                label: 'index.d.ts',
                value: 'node_modules/@mantine/form/index.d.ts',
              },
              {
                label: 'package.json',
                value: 'node_modules/@mantine/form/package.json',
              },
            ],
          },
        ],
      },
    ],
  },
];

export const customData: CustomTreeData[] = [
  {
    name: 'external_case',
    data: data1,
  },
  {
    name: 'hotline',
    data: data2,
  },
  {
    name: 'internal_case',
    data: data2,
  },
];

export const temporaryDataIDSLoaded: IDSData[] = [
  {
    name: 'external_case',
  },
  {
    name: 'hotline',
  },
  {
    name: 'internal_case',
  },
];
