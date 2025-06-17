import {
  type EeeohBindings,
  type EeeohFields,
  type EeeohOptions,
  createEeeohHooks,
} from './eeeoh';

export type HookBindings<CustomLevels extends string> =
  EeeohBindings<CustomLevels>;

export type HookOptions<CustomLevels extends string> =
  EeeohOptions<CustomLevels>;

export type HookFields = EeeohFields;

export const createHooks = createEeeohHooks;
