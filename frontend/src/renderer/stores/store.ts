import { create } from 'zustand';
import { ibexState } from 'src/renderer/types';
import { configurationSlice } from '.';

export const useIbexStore = create<ibexState>()((...a) => ({
  ...configurationSlice(...a),
}));
