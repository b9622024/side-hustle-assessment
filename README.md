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
