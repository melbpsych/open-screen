/** Compile-checked host example. It sends and persists nothing. */
import { createScreener, exportJSON, isAnswered, type Answers, type Policy, type QuestionnaireDefinition } from "open-screen";
import { DEFAULT_POLICY } from "open-screen/policy";
import { buildReport, clinicalSummary } from "open-screen/presentation";
import example from "./questionnaire.json" with { type: "json" };

const policy: Policy = structuredClone(DEFAULT_POLICY);
policy.id = "example-host";
policy.version = "development-1";
policy.rationale = "Synthetic integration example; not a clinical recommendation.";
policy.thresholds.depression.gate = 3;

const screener = createScreener({ policy, questionnaires: [example as QuestionnaireDefinition] });
const setup = screener.createSetup({ context: "clinical" });
const answers: Answers = {};
const question = screener.nextStep(setup, answers);
if (question?.options?.[0]) {
  // Store the original code. The engine applies any reverse key exactly once.
  answers[question.id] = question.options[0].value;
  if (!isAnswered(question, answers)) throw new Error("Expected a valid response");
}
const progress = screener.progress(setup, answers);
const record = screener.record(setup, answers, { reference: "SYNTHETIC-001" });
const summary = clinicalSummary(record, record.clinician);
const note = clinicalSummary(record, record.clinician, { concise: true });
const html = buildReport(record, record.clinician);
const json = exportJSON(record); // Raw response appendix is excluded by default.

// Supply these to the host's own view/export flow. No global event bus or transport.
export { screener, setup, answers, progress, record, summary, note, html, json };

// The optional registry has the same validated contract as host-supplied forms.
// Include only the measures your deployment needs; no measure is auto-selected.
import { questionnaires } from "../questionnaires/registry.js";
const expanded = createScreener({ questionnaires });
const tapsSetup = expanded.createSetup({
  context: "clinical",
  topics: { taps: true },
  forms: { taps: "female" },
  confirmations: { "taps:us-form": true },
});
const expandedRecord = expanded.record(tapsSetup);
for (const result of expandedRecord.additional) {
  for (const scale of result.scales || []) {
    const mean: number | null = scale.mean;
    const score: number | null = scale.sum;
    void mean; void score;
  }
}
