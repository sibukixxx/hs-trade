import { useState } from "preact/hooks"

export interface ProductInputValues {
  name: string
  description: string
  origin: string
  destination: string
  imageUrl: string
}

interface Props {
  onSubmit: (values: ProductInputValues) => void
  submitting: boolean
}

const EMPTY: ProductInputValues = { name: "", description: "", origin: "", destination: "", imageUrl: "" }

/**
 * Deliberately small: only name/description are required. Image and
 * country fields are optional and collapsed by default so a first-time
 * visitor can try a classification in well under a minute — see design
 * doc section 8 ("最初から巨大な入力フォームを表示しないでください").
 */
export function ProductInputForm({ onSubmit, submitting }: Props) {
  const [values, setValues] = useState<ProductInputValues>(EMPTY)
  const [showOptional, setShowOptional] = useState(false)

  const canSubmit = values.name.trim().length > 0 && values.description.trim().length > 0 && !submitting

  return (
    <form
      class="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (canSubmit) onSubmit(values)
      }}
    >
      <div>
        <label class="block text-sm font-medium mb-1" for="product-name">
          商品名 <span class="text-red-600">*</span>
        </label>
        <input
          id="product-name"
          class="w-full rounded border border-slate-300 px-3 py-2"
          placeholder="例: 緑茶ティーバッグ"
          value={values.name}
          onInput={(e) => setValues({ ...values, name: e.currentTarget.value })}
          required
        />
      </div>

      <div>
        <label class="block text-sm font-medium mb-1" for="product-description">
          商品説明 <span class="text-red-600">*</span>
        </label>
        <textarea
          id="product-description"
          class="w-full rounded border border-slate-300 px-3 py-2"
          rows={3}
          placeholder="分かる範囲で構いません。素材・原材料・用途など。"
          value={values.description}
          onInput={(e) => setValues({ ...values, description: e.currentTarget.value })}
          required
        />
      </div>

      {!showOptional && (
        <button
          type="button"
          class="text-sm text-blue-700 underline"
          onClick={() => setShowOptional(true)}
        >
          画像・輸出入国を追加する(任意)
        </button>
      )}

      {showOptional && (
        <div class="space-y-4 rounded border border-slate-200 bg-slate-50 p-4">
          <div>
            <label class="block text-sm font-medium mb-1" for="product-image">
              画像URL(任意)
            </label>
            <input
              id="product-image"
              class="w-full rounded border border-slate-300 px-3 py-2"
              placeholder="https://..."
              value={values.imageUrl}
              onInput={(e) => setValues({ ...values, imageUrl: e.currentTarget.value })}
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1" for="product-origin">
                輸出元国(任意)
              </label>
              <input
                id="product-origin"
                class="w-full rounded border border-slate-300 px-3 py-2"
                placeholder="例: JP"
                value={values.origin}
                onInput={(e) => setValues({ ...values, origin: e.currentTarget.value })}
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1" for="product-destination">
                輸入先国(任意)
              </label>
              <input
                id="product-destination"
                class="w-full rounded border border-slate-300 px-3 py-2"
                placeholder="例: US"
                value={values.destination}
                onInput={(e) => setValues({ ...values, destination: e.currentTarget.value })}
              />
            </div>
          </div>
        </div>
      )}

      <button
        type="submit"
        class="w-full rounded bg-blue-700 px-4 py-2 font-medium text-white disabled:opacity-50"
        disabled={!canSubmit}
      >
        {submitting ? "分類中..." : "HSコードを分類してみる"}
      </button>
    </form>
  )
}
