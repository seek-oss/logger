import { type EeeohFields, type EeeohOptions, createEeeohHooks } from './eeeoh';

export type HookOptions<CustomLevels extends string> =
  EeeohOptions<CustomLevels>;

export type HookFields<CustomLevels extends string> = EeeohFields<CustomLevels>;

export const createHooks = createEeeohHooks;
