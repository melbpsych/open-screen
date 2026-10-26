/** Reviewed local definitions. No questionnaires or answers are fetched remotely.
 * Each measure is optional; clinical defaults stay brief. See docs/MEASURES.md
 * for exact versions, rights, keys, interpretation and external-only candidates.
 */
import { immutableCopy } from '../core/validation.js'
import asrs from './asrs-v1-1.json' with { type: 'json' }
import taps from './taps.json' with { type: 'json' }
import dissociation from './dss-b.json' with { type: 'json' }
import mini from './mini-ipip.json' with { type: 'json' }
import neo from './ipip-neo-120.json' with { type: 'json' }
import anger from './catpd-anger.json' with { type: 'json' }
import affect from './catpd-affective-lability.json' with { type: 'json' }
import planning from './catpd-non-planfulness.json' with { type: 'json' }
import mistrust from './catpd-mistrust.json' with { type: 'json' }
export const questionnaires = immutableCopy([asrs, taps, dissociation, mini, neo, anger, affect, planning, mistrust])
