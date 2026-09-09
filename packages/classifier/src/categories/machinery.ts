import type { CategoryDefinition } from "./types.js"

export const machineryCategory: CategoryDefinition = {
  id: "machinery",
  chapterCodes: ["85"],
  matchKeywords: [
    "機械",
    "機器",
    "電動",
    "モーター",
    "ミキサー",
    "グラインダー",
    "家電",
    "machine",
    "appliance",
    "motor",
    "mixer",
    "grinder"
  ],
  requiredFacts: [
    {
      key: "function",
      question: "この機械/機器は何をするものですか?主な機能を教えてください。",
      reason: "機能によって該当する類・項が変わります。",
      acceptableSources: ["USER_DECLARED", "TEXT_INFERRED"]
    },
    {
      key: "complete_or_part",
      question: "完成品ですか、それとも部品ですか?",
      reason: "完成品か部品かで分類の考え方が変わります。",
      acceptableSources: ["USER_DECLARED", "TEXT_INFERRED"]
    }
  ]
}
