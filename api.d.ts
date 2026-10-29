/** Public contracts. Runtime validation remains authoritative for JSON inputs.
 * Keep these declarations and examples/integration.ts in step with api.js.
 */
export type DeepReadonly<T> = T extends (...args: never[]) => unknown ? T : T extends object ? { readonly [K in keyof T]: DeepReadonly<T[K]> } : T;
export type Bands = ReadonlyArray<readonly [exclusiveUpperBound: number, label: string]>;
/** Missing answers never enter scoring and cannot be confused with narrative text. */
export interface MissingAnswer { missing: "prefer-not-to-answer" | "unable-to-answer" }
export type Answers = Record<string, number | string | MissingAnswer>;
export type Status = "scored" | "incomplete" | "gate-closed" | "not-selected" | "omitted";
export interface Policy {
  schemaVersion: 1;
  id: string;
  version: string;
  rationale: string;
  defaults: { context: "clinical" | "forensic" | null; topics: readonly string[]; primaryTopics: readonly string[] };
  thresholds: {
    depression: { gate: number; screen: number; bands: Bands };
    anxiety: { gate: number; screen: number; bands: Bands };
    alcohol: { allowed: readonly number[]; default: number | null };
    trauma: { gate: number; pclItem: number };
  };
  personality: { followUpBands: readonly ("low" | "middle" | "high")[] };
  responsePatterns: { screenMean: number; poleRate: number; runLength: number; sameRate: number; withinSD: number };
}
export interface QuestionnaireDefinition {
  schemaVersion: 1;
  id: string;
  version: string;
  label: string;
  title: string;
  stem?: string;
  phase?: 1 | 2;
  locked?: boolean;
  algorithm?: "asrs-v1.1" | "taps";
  formChoices?: readonly { id: string; label: string }[];
  scales?: readonly { id: string; label: string; itemIds: readonly string[]; level?: "domain" | "facet" }[];
  license: { id: string; url: string; attribution: string };
  source: { citation: string; url: string; limits: string };
  items: readonly { id: string; text: string; stem?: string; kind?: "choice" | "text"; options?: readonly { value: number; score: number; label: string }[] }[];
  gate?: { itemCount: number; threshold: number; title: string };
  bands?: Bands;
  screenAt?: number;
  requirements?: readonly { id: string; label: string }[];
}
export interface Setup {
  mode?: "screening" | "monitoring";
  advanceMode?: "automatic" | "manual";
  context: "clinical" | "forensic" | null;
  topics: Record<string, boolean>;
  followUps: Record<string, boolean>;
  confirmations: Record<string, boolean>;
  forms?: Record<string, string>;
  auditFee: "yes" | "no" | null;
  auditThreshold: number | null;
  definedPatientGroup: boolean;
  scoresToClinician: boolean;
  scaleNotSold: boolean;
}
export interface Clinician {
  practice?: Partial<Record<'referral' | 'purpose' | 'recipient' | 'conditions' | 'collateral' | 'selfReport' | 'observations' | 'uncertainty' | 'goals' | 'functioning' | 'safetyMethod' | 'safetyOutcome' | 'safetyReason' | 'followUpAction' | 'followUpOwner' | 'followUpDue', string>> & { omissionsReviewed?: boolean };
  reference?: string;
  facts?: string;
  flags?: Record<string, string | number>;
  entered?: Record<string, string | number>;
  auditSex?: "woman" | "man" | "not-recorded";
  safetyReview?: "Not recorded" | "Reviewed in interview" | "Follow-up required" | "Deferred" | "Declined" | null;
  safetyAcknowledged?: boolean;
  /** Retains an endorsement if the response is later corrected or declined. */
  safetyEndorsed?: boolean;
}
export interface QuestionStep {
  id: string;
  instrument: string;
  kind: "text" | "choice";
  title: string;
  stem?: string | null;
  kicker: string;
  stage: 1 | 2;
  index: number;
  count: number;
  options?: { label: string; value: string | number; /** @deprecated Original response code alias. Use value. */ score: string | number }[];
  footer?: string;
  optional?: boolean;
  anchors?: string[];
  examples?: string[];
  lead?: boolean;
  quiet?: string;
}
export interface SymptomResult {
  id: string; label: string; brief: string; full: string;
  status: Status; max: number; total: number | null; band: string | null; bands: Bands;
  gateScore: number | null; threshold: number; screenThreshold: number;
  thresholdMet: boolean; override: boolean; opened: boolean; positive: boolean | null;
  safetyFlag: boolean; difficulty: string | null; priorFollowUp: boolean;
  evidence: string; sentence: string;
}
export interface AdditionalResult {
  id: string; label: string; full: string; brief: string; version: string;
  status: Status; max: number | null; gateMax: number | null; threshold: number | null;
  total?: number | null; gateScore?: number | null; band?: string | null; bands: Bands;
  override?: boolean; opened?: boolean; positive?: boolean | null; reason?: string;
  source: QuestionnaireDefinition["source"];
  license: QuestionnaireDefinition["license"];
  screenAt?: number | null;
  algorithm?: "asrs-v1.1" | "taps";
  continuousTotal?: number | null;
  scales?: { id: string; label: string; level?: "domain" | "facet"; status: Status; sum: number | null; min: number; max: number; mean: number | null; count?: number; stopRule?: string | null; note?: string }[];
}
export interface Configuration {
  engineVersion: string;
  rulesVersion: string;
  policy: Policy;
  questionnaires: readonly QuestionnaireDefinition[];
}
export interface ScreeningRecord {
  /** Optional lifecycle metadata supplied by the assessment workflow; bare factory records remain draft. */
  assessment?: { id: string; startedAt: string; updatedAt: string; review: { status: 'draft' } | { status: 'final'; by: string; at: string; digest: string } };
  schemaVersion: 1;
  configuration: Configuration;
  generatedAt: string;
  setup: Setup;
  policy: Policy;
  clinician: Clinician;
  responses: Answers;
  omissions: Record<string, MissingAnswer>;
  forensic: boolean;
  safetyFlag: boolean;
  symptoms: SymptomResult[];
  additional: AdditionalResult[];
  alcohol: { status: Status; gateScore?: number; threshold?: number; total?: number; [key: string]: unknown };
  trauma: { status: Status; count?: number; threshold?: number; pcl?: { status: Status; total?: number; event?: string; provisional?: boolean; endorsementThreshold?: number; [key: string]: unknown } | null; [key: string]: unknown };
  stress: { status: Status; raw?: number; doubled?: number; reason?: string; sentence?: string };
  /** Legacy personality and response-pattern structures are documented in their modules. */
  personality: unknown;
  ipip: { id: string; label: string; status: Status; sum?: number; [key: string]: unknown }[];
  validity: unknown;
  cards: readonly unknown[];
  references: { id: string; apa: string }[];
  text: string;
}
export interface ScreenerOptions {
  policy?: Policy;
  questionnaires?: readonly QuestionnaireDefinition[];
  clock?: () => string;
}
export interface Screener {
  readonly apiVersion: 1;
  readonly policy: DeepReadonly<Policy>;
  readonly catalog: ReadonlyArray<DeepReadonly<{ id: string; name: string; detail: string; tag: string; formChoices?: readonly { id: string; label: string }[]; requirements?: { id: string; label: string }[] }>>;
  readonly configuration: DeepReadonly<Configuration>;
  createSetup(overrides?: Partial<Setup>): Setup;
  validateAnswers(answers?: unknown): { id: string; code: "unknown-item" | "invalid-response" }[];
  getSteps(setup: Setup, answers?: Answers): QuestionStep[];
  nextStep(setup: Setup, answers?: Answers): QuestionStep | null;
  progress(setup: Setup, answers?: Answers): { done: number; total: number; finished: boolean };
  setupErrors(setup: Setup): string[];
  record(setup: Setup, answers?: Answers, clinician?: Clinician): DeepReadonly<ScreeningRecord>;
  licences(setup: Setup, answers?: Answers): readonly { title: string; url: string; limit: string }[];
  symptomDefinitions(setup: Setup): ReadonlyArray<DeepReadonly<{ id: string; label: string; brief: string; full: string; openAt: number; screenAt: number; bands: Bands; source: string }>>;
}
export const API_VERSION: 1;
export const ENGINE_VERSION: string;
export const RULES_VERSION: string;
export function createScreener(options?: ScreenerOptions): Screener;
export function isAnswered(step: QuestionStep, answers: Answers): boolean;
/** Clinical data remains sensitive even when raw responses are omitted. */
export function exportJSON(record: DeepReadonly<ScreeningRecord>, options?: { includeResponses?: boolean }): string;
