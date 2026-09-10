// A static referral, not a lead-capture form: no email is collected here,
// no data is sent anywhere. Set VITE_B2B_CONTACT_URL to make "TechVit" a
// link to your real contact channel; otherwise it renders as plain text.
const CONTACT_URL = import.meta.env.VITE_B2B_CONTACT_URL

export function BusinessInquiryNote() {
  return (
    <p class="text-xs text-slate-400 text-center px-4">
      業務利用(社内システムへの組み込み、商品マスターとの連携、AIを活用した貿易業務改善など)については
      {CONTACT_URL ? (
        <a href={CONTACT_URL} class="underline hover:text-slate-600" target="_blank" rel="noreferrer">
          TechVit
        </a>
      ) : (
        "TechVit"
      )}
      へご相談ください。
    </p>
  )
}
