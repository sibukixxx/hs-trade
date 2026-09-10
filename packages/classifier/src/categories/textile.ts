import type { CategoryDefinition } from "./types.js"

export const textileCategory: CategoryDefinition = {
  id: "textile",
  chapterCodes: ["61", "62"],
  matchKeywords: [
    "シャツ",
    "tシャツ",
    "衣類",
    "衣料",
    "服",
    "ニット",
    "メリヤス",
    "織物",
    "繊維",
    "garment",
    "shirt",
    "t-shirt",
    "tshirt",
    "textile",
    "apparel",
    "fabric"
  ],
  requiredFacts: [
    {
      key: "fiber_composition",
      question: "主な素材と構成比を教えてください(例: 綿100%)。",
      reason: "繊維製品の関税分類は素材構成によって大きく変わるため必要です。",
      acceptableSources: ["USER_DECLARED"]
    },
    {
      key: "knit_or_woven",
      question: "ニット(メリヤス編み)ですか、織物ですか?",
      reason: "編み物か織物かで該当する類(61類/62類)が変わります。",
      acceptableSources: ["USER_DECLARED", "TEXT_INFERRED"]
    },
    {
      key: "garment_type",
      question: "衣類の種類を教えてください(例: Tシャツ、シャツ、パンツ等)。",
      reason: "品目の種類によって該当する項が変わります。",
      acceptableSources: ["USER_DECLARED", "TEXT_INFERRED"]
    }
  ]
}
