import { type EeeohFields, type EeeohOptions, createEeeohHooks } from './eeeoh';

export type HookOptions = EeeohOptions;

export type HookFields = EeeohFields;

export const createHooks = createEeeohHooks;
