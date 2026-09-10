import type { HsDataset } from "./types.js"
import chapters from "../../../data/hs/chapters.json"
import headings from "../../../data/hs/headings.json"
import subheadings from "../../../data/hs/subheadings.json"
import meta from "../../../data/hs/meta.json"

/**
 * The bundled demo HS dataset (data/hs/*.json). P0 deliberately uses a
 * small, curated, static dataset instead of a database — see README
 * "Dataset source" and "Limitations".
 */
export const hsDataset: HsDataset = {
  version: meta.version,
  source: meta.source,
  chapters,
  headings,
  subheadings
}
