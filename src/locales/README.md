# 🌐 i18n 多語系維護指南

## 目錄結構

```
src/locales/
├── zh-TW.json    # 繁體中文（主語系）
├── en.json       # 英文
└── README.md     # 本維護指南
```

---

## 新增語系流程

1. **複製主語系檔案**

   ```bash
   cp zh-TW.json {locale}.json
   # 例如: cp zh-TW.json ja.json
   ```

2. **翻譯所有 value**
   - 保持 key 結構不變
   - 僅翻譯 value 內容

3. **在 i18n 設定中註冊新語系**

   ```typescript
   // src/plugins/i18n.ts
   import ja from '../locales/ja.json'
   
   const messages = {
     'zh-TW': zhTW,
     'en': en,
     'ja': ja  // 新增
   }
   ```

4. **測試所有頁面顯示**
   - 切換至新語系
   - 確認無遺漏 key

---

## 新增 i18n Key 流程

1. **先在 `zh-TW.json` 新增 key**

   ```json
   {
     "newFeature": {
       "title": "新功能標題",
       "description": "新功能說明"
     }
   }
   ```

2. **同步新增至 `en.json`**

   ```json
   {
     "newFeature": {
       "title": "New Feature Title",
       "description": "New feature description"
     }
   }
   ```

3. **驗證語系同步**

   ```bash
   # 檢查行數差異
   wc -l src/locales/*.json
   ```

---

## Key 命名規則

### 基本規範

| 規則 | 說明 | ✅ 正確 | ❌ 錯誤 |
|------|------|---------|---------|
| 使用 camelCase | 統一命名風格 | `createMerchant` | `create_merchant` |
| Namespace 對應模組 | 按功能區分 | `merchant.title` | `title` |
| 最多 3 層嵌套 | 避免過深結構 | `finance.funds.topUp` | `finance.funds.types.topUp.btn` |
| 通用詞彙放 `common` | 共用翻譯 | `common.cancel` | 各處重複定義 |

### Namespace 對照表

| Namespace | 對應模組 |
|-----------|---------|
| `common` | 共用詞彙（按鈕、狀態、提示） |
| `menu` | 導航選單 |
| `login` | 登入頁面 |
| `merchant` | 商戶管理 (Master) |
| `merchantDashboard` | 商戶儀表板 (Merchant) |
| `invoices` | 帳單管理 |
| `finance` | 財務模組 |
| `provider` | 供應商管理 |
| `game` | 遊戲中心 |
| `system` | 系統設定 |
| `validation` | 表單驗證訊息 |

---

## 常見問題

### Q: 為何 en.json 行數較少？

A: 確保 `zh-TW.json` 與 `en.json` 結構完全對稱。任何新增 key 必須同時更新兩個檔案。

### Q: 如何處理動態參數？

```json
{
  "welcome": "歡迎, {name}",
  "itemCount": "共 {count} 項"
}
```

```vue
{{ t('welcome', { name: username }) }}
```

### Q: 元件中發現硬編碼文字怎麼辦？

1. 在語系檔中新增對應 key
2. 將硬編碼文字替換為 `t('key')`
3. 確保 en.json 也有對應翻譯

---

## 維護檢查清單

- [ ] `zh-TW.json` 與 `en.json` 行數差異 ≤ 5
- [ ] 無重複 namespace（如 `common.betLog` vs `betLog`）
- [ ] 新功能已新增對應 i18n key
- [ ] 元件中無硬編碼文字
