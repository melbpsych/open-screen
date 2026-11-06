import type {
  Configuration,
  Setup,
  Answers,
  Clinician,
  DeepReadonly,
  ExportedRecord
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
    phase: 'setup' | 'question' | 'safety' | 'handoff' | 'followups' | 'record'
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
  /** Host clinical/assessment session ID, never a login token or session secret. */
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
  record: ExportedRecord
}
export class HostSaveError extends Error {
  readonly code: 'WRITE_UNCONFIRMED' | 'STORED_CONTEXT_UNCONFIRMED'
  constructor(
    code: 'WRITE_UNCONFIRMED' | 'STORED_CONTEXT_UNCONFIRMED',
    message: string
  )
}
export interface HostReceipt {
  status: 'stored'
  recordId: string
  organisationId: string
  clientId: string
  practitionerId: string
  sessionId: string
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
