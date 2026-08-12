import { redirect } from "next/navigation";
import { isCoachAuthenticated } from "../../../lib/coach/auth";
import { loginCoach } from "../actions";

export const dynamic = "force-dynamic";

export default async function CoachLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await isCoachAuthenticated()) redirect("/coach");
  const { error } = await searchParams;
  return <main className="coach-login-shell"><section className="coach-login-card">
    <div className="brand-mark" aria-hidden="true">SH</div>
    <p className="eyebrow">Coach Console</p>
    <h1>教練後台登入</h1>
    <p>客戶資料與完整分析僅限授權教練查看。</p>
    <form action={loginCoach}>
      <label className="field"><span>後台密碼</span><input name="password" type="password" autoComplete="current-password" required minLength={12} autoFocus /></label>
      {error === "invalid" ? <p className="form-error" role="alert">密碼不正確，請重新輸入。</p> : null}
      {error === "config" ? <p className="form-error" role="alert">後台尚未完成安全設定，請聯絡系統管理者。</p> : null}
      <button className="button primary wide" type="submit">登入後台</button>
    </form>
    <a className="text-link" href="/">返回測驗首頁</a>
  </section></main>;
}
