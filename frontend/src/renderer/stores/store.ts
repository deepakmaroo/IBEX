import { create } from 'zustand';
import { ibexState } from 'src/renderer/types';
import { configurationSlice } from '.';

export const useIbexState = create<ibexState>()((...a) => ({
  ...configurationSlice(...a),
}));
