import { requireCoach } from "../../../lib/coach/auth";
import { logoutCoach } from "../actions";

export const dynamic = "force-dynamic";

export default async function CoachLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireCoach();
  return <div className="coach-shell">
    <header className="coach-header"><a href="/coach" className="coach-brand"><span>SH</span><div><strong>副業適性教練後台</strong><small>Coach Console</small></div></a><form action={logoutCoach}><button className="coach-logout" type="submit">安全登出</button></form></header>
    {children}
  </div>;
}
