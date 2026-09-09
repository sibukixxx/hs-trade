import type { CategoryDefinition } from "./types.js"

export const foodCategory: CategoryDefinition = {
  id: "food",
  chapterCodes: ["09", "21"],
  matchKeywords: [
    "茶",
    "お茶",
    "緑茶",
    "紅茶",
    "食品",
    "食料品",
    "飲料",
    "エキス",
    "tea",
    "food",
    "beverage",
    "extract"
  ],
  requiredFacts: [
    {
      key: "ingredients",
      question: "主な原材料は何ですか?",
      reason: "食品の分類は原材料によって大きく変わるため必要です。",
      acceptableSources: ["USER_DECLARED"]
    },
    {
      key: "processing_method",
      question: "どのような加工がされていますか?(例: 発酵、乾燥、粉末化)",
      reason: "加工方法(発酵の有無など)によって該当する号が変わります。",
      acceptableSources: ["USER_DECLARED"]
    }
  ]
}
