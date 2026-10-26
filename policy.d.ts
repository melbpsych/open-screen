import type { DeepReadonly, Policy } from "./api.js";
export const BUILTIN_TOPICS: readonly string[];
export const DEFAULT_POLICY: DeepReadonly<Policy>;
export function validatePolicy(policy: unknown, extraTopicIds?: readonly string[]): DeepReadonly<Policy>;
export function policyFor(setup?: { policy?: Policy }): DeepReadonly<Policy>;
export function policyNote(policy: DeepReadonly<Policy>): string;
