/** A clinician's administration choice, separate from a threshold or diagnosis. */
export const followUpTopic = step => ({ phq: 'depression', gad: 'anxiety', audit: 'alcohol', pcptsd: 'trauma', pcl: 'trauma', dass: 'irritability', ipip: 'personality', personality: 'personality' })[step.instrument] || step.instrument
export const followUpAllowed = (setup, id) => setup?.mode === 'monitoring' || setup?.followUpChoices?.[id] !== false
export const FOLLOW_UP_NOT_SELECTED = 'Full questionnaire not selected after initial screening; no full score is reported.'
