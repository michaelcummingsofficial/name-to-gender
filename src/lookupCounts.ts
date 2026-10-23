import { createDataset } from "./createDataset";
// The lite build swaps this import for ./data/us-lite (see tsup.config.ts).
import encoded from "./data/us";

export const lookupCounts = createDataset(encoded);
