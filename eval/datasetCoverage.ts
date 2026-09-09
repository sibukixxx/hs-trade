import { hsDataset } from "../packages/classifier/src/index.js"

/**
 * Does the bundled demo dataset contain this heading/subheading at all?
 * Used to tell HS_DATA_GAP (the entry doesn't exist in our data) apart
 * from RETRIEVAL_FAILURE (it exists but the keyword search didn't surface
 * it as a candidate).
 */
export function datasetContainsCode(code: string): boolean {
  const heading = code.slice(0, 4)
  return (
    hsDataset.headings.some((h) => h.code === heading) ||
    hsDataset.subheadings.some((s) => s.code === code || s.headingCode === heading)
  )
}
