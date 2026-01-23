# 📘 Code Style Guide & Best Practices

> **Project**: Aggregator Platform (Master & Merchant Portals)
> **Stack**: Vue 3, TypeScript, Vite, Naive UI, Tailwind CSS
> **Version**: 1.0.0

---

## 1. 架構規範 (Architecture Standards)

### 1.1 目錄結構 (Directory Structure)

專案採用 **雙後台 (Dual-Portal)** 架構，業務邏輯嚴格分離。

* `src/views/Master/`: **總控端**頁面，僅處理平台級管理 (Admin)。
* `src/views/Merchant/`: **商戶端**頁面，僅處理商戶營運 (Tenant)。
* `src/components/Common/`: **共用元件**，僅包含無業務邏輯的純 UI 元件 (如 `MoneyText`, `StatusBadge`)。
* `src/types/`: **全域型別定義**，所有 API 回傳值必須在此定義 Interface，嚴禁在 `.vue` 檔中定義 `interface` (除非是 Component Props)。

### 1.2 狀態管理 (State Management)

* **Local State**: 優先使用 `ref` 與 `reactive` 於 Component 內部。
* **Global State**: 使用 **Pinia**。僅用於跨頁面共享資料 (如 `UserStore` 存儲 Token 與權限, `ConfigStore` 存儲全域設定)。非必要不入 Store。

---

## 2. 程式碼風格 (Coding Conventions)

### 2.1 命名規則 (Naming)

| 項目 | 規則 | 範例 | 備註 |
| :--- | :--- | :--- | :--- |
| **Components** | PascalCase | `UserProfile.vue`, `MoneyText.vue` | 檔名與元件名一致。 |
| **Files (.ts)** | camelCase | `useMerchantList.ts`, `apiClient.ts` | 工具與 Composable。 |
| **Variables** | camelCase | `isLoading`, `merchantList` | 變數與函數。 |
| **Constants** | UPPER_SNAKE | `MAX_RETRY_COUNT`, `DEFAULT_CURRENCY` | 靜態常數。 |
| **Props** | camelCase | `showModal`, `merchantId` | 在 Template 中使用 kebab-case (`:show-modal`). |
| **API Fields** | snake_case | `user_id`, `site_code`, `total_bet` | **嚴格對齊後端 DB 欄位**，前端**不**轉成 camelCase。 |

> **⚠️ 重要**: 為了避免轉換成本與混淆，本專案前端直接使用後端的 `snake_case` 欄位名稱進行資料綁定，不使用 CamelCase Mapper。

### 2.2 TypeScript 規範

* **No Explicit Any**: 嚴禁使用 `any`。若暫時無法確定型別，請使用 `unknown` 或定義 `interface`。
* **Strict Typing**: 所有 API 回傳資料必須有對應的 Interface (位於 `src/types/`)。
* **Props Typing**: 使用 `defineProps<{ ... }>()` 的泛型語法，而非 Runtime Props。

```typescript
// ✅ Good
import type { Merchant } from '@/types/merchant'
const props = defineProps<{
  merchant: Merchant
  active: boolean
}>()

// ❌ Bad
const props = defineProps({
  merchant: Object,
  active: Boolean
})
```

### 2.3 Vue 3 Composition API

* **Script Setup**: 全面使用 `<script setup lang="ts">`。
* **Import Order**:
    1. Vue Core (`ref`, `computed`, `onMounted`)
    2. UI Library (`naive-ui`)
    3. Third-party Libs (`vue-i18n`, `echarts`)
    4. Types (`@/types/...`)
    5. Components (`./components/...`)
    6. Composables/Utils

---

## 3. UI 開發規範 (UI Guidelines)

### 3.1 Naive UI 使用原則

* **Consistent Components**: 盡量復用 `src/components/Common` 中的封裝元件，保持視覺一致性。
  * 顯示金額 -> `<MoneyText />`
  * 顯示狀態 -> `<StatusBadge />`
  * 篩選列 -> `<PageFilterBar />`
* **Message/Dialog**: 使用 `useMessage()` 與 `useDialog()` 進行互動反饋，避免原生的 `alert()` 或 `confirm()`。

### 3.2 Tailwind CSS

* **Utility-First**: 優先使用 Tailwind class 處理排版 (Layout) 與間距 (Spacing)。
* **Scoped Style**: 僅在處理複雜動畫或覆蓋 Naive UI 預設樣式時，才寫 `<style scoped>`。

```html
<!-- ✅ Good -->
<div class="p-6 flex justify-between items-center bg-gray-900">...</div>

<!-- ❌ Avoid (Unless necessary) -->
<div class="header-container">...</div>
<style scoped> .header-container { padding: 24px; ... } </style>
```

---

## 4. API 與錯誤處理 (API & Error Handling)

### 4.1 Fetch Wrapper

* 使用專案封裝的 Fetch (或日後的 Axios instance)，統一處理 Token Injection 與 Error Interception。
* **Error Handling**:
  * **401 Unauthorized**: 自動導向登入頁。
  * **Backend Logic Error (code != 0)**: 使用 `message.error(res.msg)` 顯示錯誤訊息，並 throw error 中斷流程。

### 4.2 Mocking (MSW)

* **開發階段**: 所有新功能開發**必須**先在 `src/mocks/handlers.ts` 定義 Mock API。
* **延遲模擬**: 使用 `await delay(500)` 模擬真實網路延遲，確保 Loading State 處理正確。

---

## 5. 國際化 (i18n)

* **No Hardcode String**: 嚴禁在 Template 中寫死中文或英文。
* **Usage**: 使用 `t('key')`。
  * `t('common.confirm')` -> 確認
  * `t('merchant.dashboard.title')` -> 商戶戰情中心

---

## 6. Git Commit Message 規範

格式: `type(scope): subject`

* **feat**: 新功能 (New feature)
* **fix**: 修補 Bug (Bug fix)
* **docs**: 文件修改 (Documentation)
* **style**: 格式修改 (Formatting, missing semi colons, etc)
* **refactor**: 重構 (既不是新增功能也不是修補 bug)
* **chore**: 建置過程或輔助工具的變動

範例:

* `feat(merchant): add revenue report chart`
* `fix(api): handle timeout error correctly`
* `docs: update technical design document part 3`
