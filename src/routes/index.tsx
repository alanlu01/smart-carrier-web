import { createFileRoute, Link } from "@tanstack/react-router";
import {
  QrCode,
  Bot,
  LayoutDashboard,
  ArrowRight,
  Radio,
  MapPin,
  Zap,
  Server,
  FlaskConical,
} from "lucide-react";
import { LanguageToggle, tr, useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { language } = useLanguage();
  const steps = [
    { icon: QrCode, title: "掃 QR Code", body: "每個地點固定一組碼，等同室內座標。" },
    { icon: MapPin, title: "打開網頁", body: "自動辨識位置，一鍵呼叫。" },
    { icon: Zap, title: "後端派發", body: "任務進入佇列，即時通知。" },
    { icon: Bot, title: "機器人導航", body: "輪詢 API 領取任務並前往。" },
  ];
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div
          className="absolute inset-0 z-0 opacity-90"
          style={{ background: "var(--gradient-hero)" }}
        />
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.25),transparent_40%),radial-gradient(circle_at_80%_60%,rgba(255,255,255,0.15),transparent_45%)]" />
        <div className="relative z-10 mx-auto max-w-6xl px-6 pt-20 pb-28 text-white">
          <div className="absolute top-6 right-6">
            <LanguageToggle light />
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
            <Radio className="h-3.5 w-3.5" /> {tr("室內定位 · QR Code 派發")}
          </div>
          <h1 className="mt-6 text-5xl font-bold leading-tight md:text-6xl">
            {tr("掃碼即刻")}
            <br />
            {tr("呼叫服務機器人")}
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/85">
            {tr("顧客掃 QR Code → 選擇需求 → 後端派任務 → 機器人自動導航到達。")}{" "}
            {tr("專為商場、餐廳、飯店設計的無 GPS 室內呼叫系統。")}
          </p>
          <div className="mt-8 max-w-3xl">
            <div className="mb-3 text-sm font-semibold text-white/90">{tr("選擇使用模式")}</div>
            <div className="grid gap-4 md:grid-cols-2">
              <ModeCard
                icon={Server}
                title={tr("正式系統")}
                description={tr("連接正式 API 與實體機器人，建立的任務會進入真實佇列。")}
                badge={tr("LIVE")}
                badgeClass="bg-emerald-400/20 text-emerald-50"
                adminLabel={tr("進入正式後台")}
                customerLabel={tr("進入正式顧客介面")}
                demo={false}
              />
              <ModeCard
                icon={FlaskConical}
                title={tr("Demo 模式")}
                description={tr("使用瀏覽器本機模擬資料，不會控制實體機器人。")}
                badge={tr("DEMO")}
                badgeClass="bg-amber-300/25 text-amber-50"
                adminLabel={tr("進入 Demo 後台")}
                customerLabel={tr("進入 Demo 顧客介面")}
                demo
              />
            </div>
          </div>
        </div>
      </header>

      {/* Architecture */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-3xl font-bold">{tr("系統流程")}</h2>
        <p className="mt-2 text-muted-foreground">{tr("四個步驟，從顧客到機器人。")}</p>
        <div className="mt-10 grid gap-5 md:grid-cols-4">
          {steps.map((s, i) => (
            <div
              key={i}
              className="group relative rounded-2xl border border-border bg-card p-6"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <div className="text-xs font-mono text-muted-foreground">STEP 0{i + 1}</div>
              <h3 className="mt-1 text-lg font-semibold">{tr(s.title)}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{tr(s.body)}</p>
              {i < 3 && (
                <ArrowRight className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-border md:block" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Robot API */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div
          className="rounded-3xl border border-border bg-card p-8 md:p-10"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-center gap-3">
            <Bot className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">{tr("機器人 API")}</h2>
          </div>
          <p className="mt-2 text-muted-foreground">
            {tr("Raspberry Pi / ROS2 每幾秒 GET 一次，領到任務就導航。")}
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <pre className="overflow-x-auto rounded-xl bg-foreground/95 p-4 text-xs leading-relaxed text-background">
              {language === "en"
                ? `# Claim the next task
POST /api/v1/robots/R1/tasks/claim

→ 200 {
  "id": "uuid",
  "location_code": "F1",
  "location_name": "Food court"
}
→ 204  (no task)`
                : `# 領取下一個任務
GET /api/public/tasks/next?robot_id=R1

→ 200 {
  "id": "uuid",
  "location_code": "F1",
  "location_name": "美食街",
  "note": null
}
→ 204  (沒有任務)`}
            </pre>
            <pre className="overflow-x-auto rounded-xl bg-foreground/95 p-4 text-xs leading-relaxed text-background">
              {language === "en"
                ? `# Report task completion
POST /api/v1/robots/R1/tasks/{id}/result
Content-Type: application/json

{
  "status": "done"
}`
                : `# 回報任務完成
POST /api/public/tasks/complete
Content-Type: application/json

{
  "id": "uuid",
  "status": "done"   // 或 "failed"
}`}
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
}

function ModeCard({
  icon: Icon,
  title,
  description,
  badge,
  badgeClass,
  adminLabel,
  customerLabel,
  demo,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  badge: string;
  badgeClass: string;
  adminLabel: string;
  customerLabel: string;
  demo: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/25 bg-white/12 p-4 backdrop-blur-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
            <Icon className="h-5 w-5" />
          </span>
          <div className="font-bold">{title}</div>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-black tracking-wider ${badgeClass}`}
        >
          {badge}
        </span>
      </div>
      <p className="mt-3 min-h-10 text-xs leading-relaxed text-white/80">{description}</p>
      <div className="mt-4 grid gap-2">
        <Link
          to="/admin"
          search={demo ? { demo: true } : {}}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-primary transition hover:scale-[1.02]"
        >
          <LayoutDashboard className="h-4 w-4" /> {adminLabel}
        </Link>
        <Link
          to="/call"
          search={demo ? { location: "A1", demo: true } : { location: "A1" }}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/20"
        >
          <QrCode className="h-4 w-4" /> {customerLabel}
        </Link>
      </div>
    </div>
  );
}
