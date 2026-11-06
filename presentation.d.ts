import type { Bands, Clinician, DeepReadonly, ScreeningRecord, Status } from "./api.js";
type RecordInput = DeepReadonly<ScreeningRecord>;
export function escapeHtml(value: unknown): string;
export function clinicalSummary(record: RecordInput, clinician?: Clinician, options?: { concise?: boolean }): string;
export function reportMarkup(record: RecordInput, clinician?: Clinician, options?: { appendix?: boolean; history?: HistorySeries[] }): string;
export function buildReport(record: RecordInput, clinician?: Clinician, options?: { appendix?: boolean; history?: HistorySeries[] }): string;
export const presentationStyles: string;
export interface ScorePanel {
  id: string; title: string; instrument: string; value: number | null | undefined; max: number;
  threshold: number | null; bands: Bands; band?: string | null; badge: string;
  status: Status; brief: string; note: string; evidence: string[]; override?: boolean;
}
export function resultPanels(record: RecordInput): ScorePanel[];
export function panelHtml(panel: ScorePanel): string;
export function scoreChart(input: { label: string; value: number | null; max: number; threshold?: number | null; bands?: Bands }): string;
export function scoreChartModel(input: { value: number | null; max: number; threshold?: number | null; bands?: Bands }): { value: number; max: number; point: number; threshold: number | null; cut: number | null; regions: { from: number; to: number; label: string; left: number; width: number; color: string; selected: boolean }[] } | null;
export function distributionChart(view: unknown): string;

export function profilesMarkup(record: RecordInput, options?: { expandFacets?: boolean }): string;

export interface HistorySeries { label:string; min:number; max:number; settingsChanged:boolean; comparisonNote?:string; points:{date:string;value:number;policy:string}[] }
export function historyMarkup(series:HistorySeries[]):string;
