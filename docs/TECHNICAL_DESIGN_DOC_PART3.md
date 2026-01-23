# 📋 技術設計文件 (TDD) - Part 3: 總控端詳細規格 (Master Portal Deep Dive)

> **文件狀態**: Draft
> **撰寫日期**: 2026-01-23
> **專案版本**: 0.0.1 (Phase 10.8 Completed)
> **對應檔案**: `TECHNICAL_DESIGN_DOC_PART2.md` (功能篇)

---

## 1. 戰情中心 (Dashboard / War Room)

**路徑**: `src/views/Master/Dashboard/Overview.vue`
**目的**: 提供系統管理員「上帝視角」，即時監控平台營收健康度與系統效能。

### 1.1 核心欄位定義

| 區塊 | 欄位名稱 | 格式/單位 | 定義與計算邏輯 |
| :--- | :--- | :--- | :--- |
| **KPI** | **Total GGR** | Currency (USD) | 總殺數 = Total Bet - Total Payout。綠底表示盈利，紅底表示虧損。 |
| **KPI** | **Active Players** | Integer | 今日有下注行為的不重複玩家數 (Unique Users)。 |
| **KPI** | **Total Requests** | Integer | 今日 API 請求總量，用於評估負載。 |
| **KPI** | **Avg Margin** | Percentage (%) | 平均毛利率 = (Total GGR / Total Bet) * 100。 |
| **Chart** | **Revenue Trend** | Line Chart | 雙軸顯示 GGR 與 Total Bet 的 7 日走勢，觀察 RTP 波動。 |
| **Chart** | **Provider Share** | Pie Chart | 各遊戲供應商 (如 PG, Evolution) 佔總 GGR 的比例。 |

### 1.2 業務邏輯防呆

* **健康度監控 (System Health)**: 系統後台應定期 (每 30s) Ping 各供應商 API。若響應時間 > 2000ms 標記為 `Warning (黃色)`，若 Timeout 則標記為 `Error (紅色)`。

---

## 2. 商戶管理 (Merchant Management)

**路徑**: `src/views/Master/Merchant/List.vue`
**目的**: 管理 B2B 下游商戶的開戶、配置與權限。

### 2.1 創建流程 (Create Flow)

**元件**: `CreateMerchantDrawer.vue`

1. **輸入基礎識別**:
    * **Site Code**: 必填，**3 碼大寫英文字母** (Regex: `^[A-Z]{3}$`)，全平台唯一 (e.g., `GP1`, `BET`)。
    * **Account**: 管理員登入帳號。
2. **選擇錢包模式 (Wallet Mode)**:
    * **Transfer (轉帳錢包)**: 需設定 `Initial Balance` (初始餘額)。商戶需手動劃轉額度進遊戲。
    * **Seamless (單一錢包)**: 需設定 `Credit Limit` (信用額度)。商戶使用自身錢包，平台透過 API 即時扣款。
3. **財務設定**:
    * **Currency**: 支援 USD, CNY, TWD 等。
    * **Revenue Share (%)**: 平台對商戶的抽成比例 (0-100%)。
4. **遊戲授權 (Authorized Providers)**:
    * 多選選單，決定該商戶可接入哪些供應商 (預設全選，可另行開關)。

### 2.2 狀態控管邏輯

* **Active (1)**: 正常運作。
* **Suspended (0)**: 停權。
  * **前端**: 列表中 `StatusBadge` 顯示紅色。
  * **後端**: API Gateway 應攔截該商戶的所有 API 請求 (回傳 403 Forbidden)。

---

## 3. 供應商管理 (Provider Management)

**路徑**: `src/views/Master/GameCenter/ProviderList.vue`
**詳細配置**: `ProviderConfigModal.vue`
**目的**: 管理與上游供應商 (如 PG Soft) 的 B2B 商業合約與技術介接。

### 3.1 B2B 合約設定邏輯 (Contract Config)

這部分是平台獲利的關鍵，決定了成本如何分攤。

#### 3.1.1 成本分擔規則 (Advanced Rules)

| 規則名稱 | 業務意義 | 數學邏輯 (Provider Share %) |
| :--- | :--- | :--- |
| **Slot Free Spin** | 針對老虎機免費旋轉產生的成本分攤。 | **Provider Share**: 上游供應商願意承擔的比例。<br>**Aggregator Share**: 平台需承擔的比例 (100% - Provider Share)。 |
| **Live Tip** | 真人荷官的小費收入歸屬。 | 若 Provider Share = 100%，代表小費全歸供應商，平台不抽成。 |
| **Card Fee** | 棋牌遊戲的開局費/房費。 | 設定平台是否參與房費的分潤。 |

### 3.2 技術介接設定 (Integration)

* **API URL**: 對接端點。
* **Merchant Code / Secret Key**: 上游分配給本平台的憑證。
* **Settlement Currency**: 與上游結算的貨幣 (通常為 USD 或 EUR)，若與商戶貨幣不同，需經由匯率換算。

---

## 4. 財務與資金中心 (Finance Center)

### 4.1 資金審核 (Fund Management)

**路徑**: `src/views/Master/Finance/FundManagement.vue`

**操作流程 (User Flow)**:

1. **查看列表**: 預設顯示 `status=pending` 的申請。
2. **審核 (Review)**:
    * **Approve (核准)**: 系統將自動增加商戶錢包餘額 (Transfer) 或 信用額度 (Seamless)。狀態變更為 `Approved`。
    * **Reject (拒絕)**: **必填**拒絕理由 (Reason)。狀態變更為 `Rejected`，資金不變動。
3. **人工調帳 (Manual Adjust)**:
    * 適用於誤操作修正或紅利發放。
    * 輸入 **正數** (存款) 或 **負數** (扣款)。
    * 系統會自動產生一筆 `Type=manual-adjust` 且 `Status=Approved` 的紀錄。

### 4.2 帳單管理 (Invoice Manager)

**路徑**: `src/views/Master/Finance/InvoiceManager.vue`

**帳單生命週期**:

1. **Preview (預覽)**: 選擇月份，系統計算各商戶該月 `Total GGR * Commission Rate`。
2. **Generated (生成)**: 確認無誤後寫入資料庫，狀態為 `Pending`。
3. **Paid (已付)**: 確認收到商戶款項後，管理員手動標記為 `Paid`。**此操作不可逆**。

**防呆邏輯**:

* **重複生成**: 若該月份已存在帳單，系統應提示 "是否覆蓋" 或 "禁止重複生成"。
* **跨幣別**: 帳單目前統一以 **USD** 結算 (基於 `invoice.currency` 欄位)。
