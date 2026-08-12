# 副業適性測驗

Phase 1 計分核心。唯一主要商業規則來源為
`src/scoring/config/side-hustle-scoring-config-1.0.0.json`。

## 驗證

```bash
npm install
npm run validate
```

## 已知規格缺口

V1 附件包含人格合併權重，但沒有提供星座與生命靈數對六大副業類型的修正矩陣。
引擎因此不猜測人格分數；`mergeFinalTypes` 必須收到兩組外部正式分數，否則回傳
`PERSONALITY_MATRICES_MISSING`。Behavior-only 計分、卡點、光譜、Readiness、
Business Fit、Risk Flags 與 Routing 可獨立驗證。
