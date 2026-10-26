import type { DeepReadonly, QuestionnaireDefinition } from '../api.js';
/** Reviewed immutable optional measures. Pass the whole registry or a subset
 * to createScreener; registration does not select a measure for a patient.
 */
export const questionnaires: ReadonlyArray<DeepReadonly<QuestionnaireDefinition>>;
