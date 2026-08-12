import { createFileRoute, Link } from "@tanstack/react-router";
import { QrCode, Bot, LayoutDashboard, ArrowRight, Radio, MapPin, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
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
          <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
            <Radio className="h-3.5 w-3.5" /> 室內定位 · QR Code 派發
          </div>
          <h1 className="mt-6 text-5xl font-bold leading-tight md:text-6xl">
            掃碼即刻
            <br />
            呼叫服務機器人
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/85">
            顧客掃 QR Code → 選擇需求 → 後端派任務 → 機器人自動導航到達。
            專為商場、餐廳、飯店設計的無 GPS 室內呼叫系統。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/admin"
              search={{ demo: true }}
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary shadow-lg transition hover:scale-105"
            >
              <LayoutDashboard className="h-4 w-4" /> 開啟管理後台
            </Link>
            <Link
              to="/call"
              search={{ location: "A1", demo: true }}
              className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              <QrCode className="h-4 w-4" /> 預覽顧客呼叫頁
            </Link>
          </div>
        </div>
      </header>

      {/* Architecture */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-3xl font-bold">系統流程</h2>
        <p className="mt-2 text-muted-foreground">四個步驟，從顧客到機器人。</p>
        <div className="mt-10 grid gap-5 md:grid-cols-4">
          {[
            { icon: QrCode, title: "掃 QR Code", body: "每個地點固定一組碼，等同室內座標。" },
            { icon: MapPin, title: "打開網頁", body: "自動辨識位置，一鍵呼叫。" },
            { icon: Zap, title: "後端派發", body: "任務進入佇列，即時通知。" },
            { icon: Bot, title: "機器人導航", body: "輪詢 API 領取任務並前往。" },
          ].map((s, i) => (
            <div
              key={i}
              className="group relative rounded-2xl border border-border bg-card p-6"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <div className="text-xs font-mono text-muted-foreground">STEP 0{i + 1}</div>
              <h3 className="mt-1 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
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
            <h2 className="text-2xl font-bold">機器人 API</h2>
          </div>
          <p className="mt-2 text-muted-foreground">
            Raspberry Pi / ROS2 每幾秒 GET 一次，領到任務就導航。
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <pre className="overflow-x-auto rounded-xl bg-foreground/95 p-4 text-xs leading-relaxed text-background">
              {`# 領取下一個任務
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
              {`# 回報任務完成
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
