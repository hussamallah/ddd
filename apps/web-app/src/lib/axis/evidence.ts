// evidence.ts
import { EvidenceEvent, LineKey, Source, Binary, mapABtoToken } from "./types";

const VERSION = "evidence.v2"; // bump to invalidate old local data

export const getEvidence = (): EvidenceEvent[] => {
  try {
    const raw = localStorage.getItem(VERSION);
    return raw ? JSON.parse(raw) as EvidenceEvent[] : [];
  } catch { return []; }
};

export const putEvidence = (events: EvidenceEvent[]) => {
  localStorage.setItem(VERSION, JSON.stringify(events));
};

export const addEvent = (ev: EvidenceEvent) => {
  const buf = getEvidence();
  buf.push(ev);
  putEvidence(buf);
};

export const recordAB = (line: LineKey, source: Source, choice: Binary, extra?: Partial<EvidenceEvent>) => {
  const token = mapABtoToken(line, choice);
  addEvent({ line, source, choice, token, ts: Date.now(), ...extra });
};

export const lastBySource = (src: Source): Record<LineKey, EvidenceEvent | undefined> => {
  const evs = getEvidence();
  const out: Record<LineKey, EvidenceEvent | undefined> = Object.create(null);
  for (const l of ["CONTROL","PACE","BOUNDARY","TRUTH","RECOGNITION","BONDING","STRESS"] as LineKey[]) {
    out[l] = evs.filter(e => e.source===src && e.line===l).pop();
  }
  return out;
};
