export enum NodeInfoTypeEnum {
  STRUCTURE = 'structure',
  ARRAY = 'struct_array',
  INTEGER = 'INT',
  FLOAT = 'FLT',
  STRING = 'STR',
}

export type NodeInfoChildrenResponse = {
  name: string;
  ndim: number;
  type: NodeInfoTypeEnum;
};

export type NodeInfoResponse = NodeInfoChildrenResponse & {
  shapes: number[];
  coordinates: string[];
  children: NodeInfoChildrenResponse[];
};

export type SearchNodeResponse = {
  paths: string[];
};

export type FieldValueResponse = {
  value: number[][];
};
