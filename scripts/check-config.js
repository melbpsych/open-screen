/** Registration performs strict validation. This checks the actual browser wiring. */
import { screener } from "../app-config.js"

console.log(`Policy ${screener.policy.id} · ${screener.policy.version}`)
console.log(`${screener.catalog.length} available questionnaires/topics`)
console.log(`Default topics: ${screener.policy.defaults.topics.join(", ")}`)
