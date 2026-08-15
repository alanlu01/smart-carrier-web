# Smart Carrier Web

室內自主決策能源共享載具的顧客端與管理端網頁。專案是純 Vite SPA，可在 GitHub Pages 執行；路由採用 hash history，避免 Pages 重新整理子路由時回傳 404。

介面支援繁體中文與英文，語言偏好會保存在瀏覽器，適用於同一台裝置後續掃描不同地點的 QR Code。

## 本機啟動

```bash
cp .env.example .env.local
npm install
npm run dev
```

完整離線展示不需要連線至雲端 API：

- 顧客端：`http://127.0.0.1:5173/#/call?location=A1&demo=true`
- 管理端：`http://127.0.0.1:5173/#/admin?demo=true`

## GitHub Pages

1. 在 Repository Settings → Pages 將 Source 設為 **GitHub Actions**。
2. 在 Settings → Secrets and variables → Actions → Variables 設定 `VITE_API_BASE_URL`。
3. Push 到 `main` 後，`.github/workflows/pages.yml` 會建置並發布 `dist`。

正式網站路徑為 `https://alanlu01.github.io/smart-carrier-web/`，顧客 QR Code 路徑例如：

```text
https://alanlu01.github.io/smart-carrier-web/#/call?location=A1
```

敏感資料不得使用 `VITE_*` 或放進此 Repository。

## 正式 API

非 Demo 模式透過 FastAPI 存取 Oracle Autonomous Database，不再由瀏覽器直接連線資料庫：

```dotenv
VITE_API_BASE_URL=https://api.138-2-34-203.sslip.io
```

- 顧客端可以讀取地點、建立及取消工單，並每 3 秒同步工單狀態。
- 管理端每 5 秒同步工單及地點；公開靜態網站不包含管理密鑰，因此正式資料的異動功能需等管理員登入 API 完成後開放。
- `?demo=true` 仍使用 `localStorage`，不受網路或後端狀態影響。
