
export enum NodeInfoTypeEnum {
  STRUCTURE = "structure",
  ARRAY= "struct_array",
  INTEGER="INT",
  FLOAT="FLT",
  STRING="STR"
}

export type NodeInfoChildren = {
  name: string,
  ndim: number,
  type: NodeInfoTypeEnum
}

export type NodeInfo = NodeInfoChildren & {
  shapes: number[],
  children: NodeInfoChildren[]
}