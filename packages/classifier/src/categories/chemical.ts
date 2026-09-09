import type { CategoryDefinition } from "./types.js"

export const chemicalCategory: CategoryDefinition = {
  id: "chemical",
  chapterCodes: ["29"],
  matchKeywords: [
    "化学",
    "薬品",
    "試薬",
    "酸",
    "溶剤",
    "chemical",
    "reagent",
    "acid",
    "compound"
  ],
  requiredFacts: [
    {
      key: "chemical_name",
      question: "化学名を教えてください(可能であればCAS番号も)。",
      reason: "化学品はまず化学名/組成が特定できないと分類できません。",
      acceptableSources: ["USER_DECLARED"]
    },
    {
      key: "is_mixture",
      question: "単一の化合物ですか、それとも混合物ですか?",
      reason: "単一化合物か混合物かで分類の考え方が変わります。",
      acceptableSources: ["USER_DECLARED"]
    }
  ]
}
