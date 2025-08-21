// types.ts
export type LineKey =
  | "CONTROL" | "PACE" | "BOUNDARY" | "TRUTH" | "RECOGNITION" | "BONDING" | "STRESS";

export type Source = "BANK" | "HEAT" | "FRIEND" | "BET" | "BET_RESULT";
export type Token = "CLOSE" | "STALL" | "FRAG";
export type Binary = "A" | "B";

export interface EvidenceEvent {
  line: LineKey;
  source: Source;
  choice?: Binary;           // for HEAT/FRIEND/BET
  token?: Token;             // resolved token
  charge?: 0 | 1 | 2;        // HEAT intensity dots
  mismatch?: boolean;        // HEAT vs FRIEND disagreement
  ts: number;                // epoch ms
  meta?: { betDueAt?: number; passed?: boolean };
}

export const LINES: LineKey[] = [
  "CONTROL","PACE","BOUNDARY","TRUTH","RECOGNITION","BONDING","STRESS"
];

export const mapABtoToken = (line: LineKey, choice: Binary): Token => {
  switch (line) {
    case "CONTROL":      return choice === "A" ? "CLOSE" : "STALL"; // ENFORCE vs NEGOTIATE
    case "PACE":         return choice === "A" ? "CLOSE" : "FRAG";  // FOCUS vs THREAD
    case "BOUNDARY":     return choice === "A" ? "CLOSE" : "STALL"; // NO vs EXPLAIN
    case "TRUTH":        return choice === "A" ? "CLOSE" : "STALL"; // LOCK vs DELAY
    case "RECOGNITION":  return choice === "A" ? "CLOSE" : "FRAG";  // RECEIPT vs STAGE
    case "BONDING":      return choice === "A" ? "CLOSE" : "STALL"; // LINE vs SOFTEN
    case "STRESS":       return choice === "A" ? "CLOSE" : "FRAG";  // SEQUENCE vs HOP
  }
};
