import { IDSData } from "./ids";

export interface Configuration {
  name: string;
  url?: string;
  saved?: boolean;
  dataIDS: IDSData[];
}

export interface ConfigForm {
  name: string;
}
