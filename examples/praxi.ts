/** Compile-checked transport contract for a Praxi-owned assessment app.
 * Callbacks must be implemented in the CURRENT receiving Praxi deployment.
 * This file deliberately contains no invented API endpoint or bearer token.
 */
import {
  createHostBridge,
  type HostContext,
  type HostPayload,
  type HostReceipt,
  type Assessment
} from 'open-screen/host'
import type { DeepReadonly } from 'open-screen'
export interface PraxiAssessmentServices {
  currentAuthorisedContext(): Promise<HostContext>
  /** Dispatch the canonical typed Praxi action; server checks auth, RLS, client
   * access, session, expected context and idempotency in the same transaction. */
  persistOpenScreenAssessment(
    payload: DeepReadonly<HostPayload>
  ): Promise<HostReceipt>
}
export function connectPraxi(services: PraxiAssessmentServices) {
  const bridge = createHostBridge({
    getContext: () => services.currentAuthorisedContext(),
    persist: (payload) => services.persistOpenScreenAssessment(payload)
  })
  return async (
    assessment: DeepReadonly<Assessment>,
    confirmedContext: HostContext
  ) => bridge.save(assessment, confirmedContext)
}
