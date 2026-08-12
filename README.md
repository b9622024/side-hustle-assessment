# 副業適性測驗

Phase 1 計分核心。V1.0.0 原始商業規則保留於
`src/scoring/config/side-hustle-scoring-config-1.0.0.json`，V1.0.1 校正規則位於
`src/scoring/config/side-hustle-calibration-1.0.1.json`。

## 驗證

```bash
npm install
npm run validate
npm run validate:exhaustive
```

## V1.0.1 校正

- 補齊星座元素／模式與生命靈數 1～9、11、22、33 的六型矩陣。
- 人格合併維持 Behavior 75%、Numerology 15%、Astrology 10%。
- Behavior Type 低於 3.0 時，Final Type 仍以 3.4 封頂。
- Business Fit 保留原權重與 Behavior-only 原則，使用問卷可達範圍正規化至 1～5。
- 修正 A、C 實務不可達與高適配近 A 個案誤落 D 的 Routing 缺口。

## Phase 2 測驗表單

- Next.js App Router 測驗流程：基本資料 → 副業現況 → 10 題行為題 → 確認送出。
- 每頁最多兩題，提供進度條、上一頁與下一頁。
- 使用版本化 localStorage 暫存，重新整理後答案不遺失。
- `/api/assessments` 執行伺服器端輸入驗證並產生 `SH-YYYYMMDD-XXXXXX` 編號。
- `/complete` 只顯示測驗編號，不洩漏 ABCD、Readiness、Business Fit 或教練資料。
- Phase 2 尚未串接資料庫，完成資料不會永久保存。

## Phase 3 客戶報告

- 新增客戶報告專用資料模型與轉換層，輸出不包含路由、準備度、商業適配度、風險旗標、AI 潛力或諮詢優先級。
- 報告包含星座工作風格、生命靈數、副業行動輪廓、六種副業模式、五項摩擦風險與四條執行偏好光譜。
- 支援桌面雙欄、手機單欄與列印版面；雷達圖使用伺服器端 SVG，不增加客戶端圖表套件。
- 開發模式可於 `/internal/report-preview` 查看隔離的範例資料；正式環境會回傳 404。
- 目前尚未串接星盤計算服務或資料庫；正式報告產生器接受已計算完成的太陽、月亮與上升資料。
