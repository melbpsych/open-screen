import type { Assessment } from './host.js'
import type {
  Configuration,
  Setup,
  Answers,
  Clinician,
  DeepReadonly,
  ScreeningRecord,
  Screener
} from '../api.js'
export function newAssessment(
  configuration: DeepReadonly<Configuration>,
  setup: Setup,
  answers: Answers,
  clinician: Clinician,
  workflow: Assessment['workflow'],
  identity?: { id?: string; startedAt?: string }
): DeepReadonly<Assessment>
export function validateAssessment(value: unknown): DeepReadonly<Assessment>
export function verifyAssessment(
  value: unknown
): Promise<DeepReadonly<Assessment>>
export function finaliseAssessment(
  value: DeepReadonly<Assessment>,
  by: string,
  at?: string
): Promise<DeepReadonly<Assessment>>
export function assessmentRecord(
  value: DeepReadonly<Assessment>
): DeepReadonly<
  ScreeningRecord & {
    assessment: {
      id: string
      startedAt: string
      updatedAt: string
      review: Assessment['review']
    }
  }
>
export function assessmentFactory(value: DeepReadonly<Assessment>): Screener
export function assessmentContent(value: DeepReadonly<Assessment>): string
export function verifyBundle(
  value: unknown
): Promise<
  DeepReadonly<{ schemaVersion: 1; current: Assessment; history: Assessment[] }>
>
export function canonical(value: unknown): string
export function digest(value: string): Promise<string>
export function timestamp(value: unknown): string
/** Process-local proof for immutable records derived from verified finals. */
export function isVerifiedRecord(value: unknown): boolean
