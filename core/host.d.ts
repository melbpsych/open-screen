import type {
  Configuration,
  Setup,
  Answers,
  Clinician,
  DeepReadonly,
  ScreeningRecord
} from '../api.js'
export interface Assessment {
  schemaVersion: 1
  id: string
  startedAt: string
  updatedAt: string
  configuration: Configuration
  setup: Setup
  answers: Answers
  clinician: Clinician
  workflow: {
    phase: 'setup' | 'question' | 'safety' | 'handoff' | 'record'
    cursor: string | null
  }
  review:
    | { status: 'draft' }
    | { status: 'final'; by: string; at: string; digest: string }
}
export interface HostContext {
  organisationId: string
  clientId: string
  practitionerId: string
  sessionId: string
  patientReference: string
  canWriteAssessments: true
}
export interface HostPayload {
  schemaVersion: 1
  source: 'open-screen'
  target: DeepReadonly<HostContext>
  idempotencyKey: string
  assessmentId: string
  attestationDigest: string
  record: Omit<ScreeningRecord, 'responses'> & { responses?: Answers }
}
export interface HostReceipt {
  status: 'stored'
  recordId: string
  organisationId: string
  clientId: string
  assessmentId: string
  attestationDigest: string
  idempotencyKey: string
}
export function validateHostContext(value: unknown): DeepReadonly<HostContext>
export function createHostBridge(callbacks: {
  getContext: () => Promise<HostContext>
  persist: (payload: DeepReadonly<HostPayload>) => Promise<HostReceipt>
}): {
  save: (
    assessment: DeepReadonly<Assessment>,
    expectedContext: HostContext,
    options?: { includeResponses?: boolean }
  ) => Promise<DeepReadonly<HostReceipt>>
}
