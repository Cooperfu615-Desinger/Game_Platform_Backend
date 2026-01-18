<script setup lang="ts">
import { ref, h, onMounted, computed } from 'vue'
import {
  NCard, NInput, NDatePicker, NSelect, NButton,
  NDataTable, NTag, NModal, NCode, NSpace, NTooltip
} from 'naive-ui'
import { useI18n } from 'vue-i18n'
import type { DataTableColumns } from 'naive-ui'
import { useRoundSearch } from '../../../composables/useRoundSearch'
import type { BetLog } from '../../../types/report'

const { t } = useI18n()
// Extending composable search model for aggregator fields
const { loading, searchModel, logs, handleSearch } = useRoundSearch()

// Initialize
onMounted(() => {
    handleSearch()
})

// Options
const providerOptions = [
    { label: t('common.all'), value: '' },
    { label: 'PG Soft', value: 'pg' },
    { label: 'Evolution', value: 'evo' },
    { label: 'Pragmatic Play', value: 'pp' }
]

const currencyOptions = [
    { label: t('common.all'), value: '' },
    { label: 'USD', value: 'USD' },
    { label: 'THB', value: 'THB' },
    { label: 'VND', value: 'VND' },
    { label: 'CNY', value: 'CNY' }
]

// Modal Control
const showDetail = ref(false)
const detailedLog = ref<BetLog | null>(null)
const jsonContent = ref('')

const openDetail = (row: BetLog) => {
    detailedLog.value = row
    // Combine detail with aggregator metadata for full view
    const fullDetail = {
        platformId: row.id,
        upstreamId: row.txId,
        provider: row.providerName,
        meta: {
            merchant: row.merchant_code,
            currency: row.currency,
            rate: row.exchangeRate
        },
        game_detail: row.game_detail
    }
    jsonContent.value = JSON.stringify(fullDetail, null, 2)
    showDetail.value = true
}

// Columns
const columns = computed<DataTableColumns<BetLog>>(() => [
    { 
        title: t('betLog.time'), 
        key: 'created_at', 
        width: 160,
        render: (row) => h('div', { class: 'text-xs' }, new Date(row.created_at).toLocaleString())
    },
    { 
        title: t('betLog.merchant'), 
        key: 'merchant_code', 
        width: 100,
        render: (row) => h(NTag, { size: 'small', bordered: false }, { default: () => row.merchant_code })
    },
    { 
        title: t('betLog.provider'), 
        key: 'providerName', 
        width: 120,
        render: (row) => {
            // Extract badge color from name prefix logic (mock) or just hash
            const type = row.providerCode === 'pg' ? 'error' : row.providerCode === 'evo' ? 'warning' : 'info'
            return h(NTag, { type, size: 'small' }, { default: () => row.providerName })
        }
    },
    { 
        title: t('betLog.game'), 
        key: 'game_name', 
        width: 140,
        ellipsis: true
    },
    { 
        title: t('betLog.originalAmount'), 
        key: 'originalBet', 
        width: 150,
        align: 'right',
        render: (row) => h('div', { class: 'text-right' }, [
            h('div', { class: 'text-xs text-gray-400' }, `${row.originalBet?.toFixed(2)} ${row.currency}`),
            h('div', { class: row.originalWin! > 0 ? 'text-green-500 font-bold' : '' }, 
                `${row.originalWin?.toFixed(2)} ${row.currency}`
            )
        ])
    },
    { 
        title: t('betLog.baseAmount'), 
        key: 'bet_amount', 
        width: 120,
        align: 'right',
        render: (row) => {
             // Tooltip for exchange rate
            const trigger = h('div', { class: 'cursor-help' }, [
                h('div', { class: 'text-xs text-gray-500' }, `$${row.bet_amount.toFixed(2)}`),
                h('div', { class: row.win_amount > 0 ? 'text-green-400 font-bold' : '' }, `$${row.win_amount.toFixed(2)}`)
            ])
            
            return h(NTooltip, { trigger: 'hover' }, {
                trigger: () => trigger,
                default: () => `${t('betLog.rate')}: ${row.exchangeRate} (USD)`
            })
        }
    },
    {
        title: t('common.status'),
        key: 'status',
        width: 90,
        render: (row) => {
            const map: Record<string, 'success' | 'error' | 'warning'> = {
                win: 'success', loss: 'error', refund: 'warning'
            }
            return h(NTag, { type: map[row.status] || 'default', bordered: false, size: 'small' }, 
                { default: () => row.status.toUpperCase() }
            )
        }
    },
    {
        title: t('common.action'),
        key: 'actions',
        width: 80,
        fixed: 'right',
        render: (row) => h(NButton, { 
            size: 'tiny', secondary: true, onClick: () => openDetail(row) 
        }, { default: () => t('common.viewDetail') })
    }
])
</script>

<template>
  <div class="p-6 h-full flex flex-col">
    <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold flex items-center gap-2">
            <span>📊</span> {{ t('betLog.title') }}
        </h1>
        <n-button type="primary" dashed @click="handleSearch">{{ t('common.refresh') }}</n-button>
    </div>

    <!-- Aggregator Filter Bar -->
    <n-card size="small" class="mb-4">
        <n-space vertical>
            <div class="flex flex-wrap gap-3">
                <n-date-picker 
                    v-model:value="searchModel.timeRange" 
                    type="datetimerange" 
                    clearable 
                    :placeholder="t('betLog.timeRange')"
                    class="w-80"
                />
                <n-input v-model:value="searchModel.merchantCode" :placeholder="t('betLog.merchant')" class="w-32" />
                <n-select v-model:value="searchModel.provider" :options="providerOptions" :placeholder="t('betLog.provider')" class="w-40" clearable />
                <n-select v-model:value="searchModel.currency" :options="currencyOptions" placeholder="Currency" class="w-28" clearable />
                <n-input v-model:value="searchModel.playerId" :placeholder="t('betLog.playerAccount')" class="w-40" />
                <n-input v-model:value="searchModel.roundId" placeholder="ID / TXID" class="w-40" />
                
                <n-button type="primary" @click="handleSearch" :loading="loading">
                    {{ t('betLog.searchLogs') }}
                </n-button>
            </div>
        </n-space>
    </n-card>

    <!-- Data Table -->
    <n-data-table
        :columns="columns"
        :data="logs"
        :loading="loading"
        flex-height
        :pagination="{ pageSize: 20 }"
        class="flex-1 bg-[#18181c] rounded-lg shadow-sm"
        :single-line="false"
    />

    <!-- Detail Modal -->
    <n-modal v-model:show="showDetail" preset="card" :title="t('betLog.roundDetail')" style="width: 800px">
        <div class="grid grid-cols-3 gap-4 h-[500px]">
            <!-- Info -->
            <div class="col-span-1 bg-gray-800/50 p-4 rounded space-y-4 border border-gray-700">
                <div class="space-y-1">
                    <div class="text-xs text-gray-400">{{ t('betLog.roundId') }}</div>
                    <div class="font-mono text-sm break-all">{{ detailedLog?.id }}</div>
                </div>
                <div class="space-y-1">
                    <div class="text-xs text-gray-400">{{ t('betLog.txId') }}</div>
                    <div class="font-mono text-sm break-all text-amber-500">{{ detailedLog?.txId }}</div>
                </div>
                 <div class="space-y-1 pt-2 border-t border-gray-700">
                    <div class="text-xs text-gray-400">{{ t('betLog.merchant') }}</div>
                    <div class="font-bold">{{ detailedLog?.merchant_code }}</div>
                </div>
                <div class="space-y-1">
                    <div class="text-xs text-gray-400">{{ t('betLog.rate') }}</div>
                    <div class="font-mono">{{ detailedLog?.currency }} ({{ detailedLog?.exchangeRate }})</div>
                </div>
            </div>
            
            <!-- JSON -->
            <div class="col-span-2 bg-[#1e1e1e] p-4 rounded overflow-auto font-mono text-xs border border-gray-700">
                 <n-code :code="jsonContent" language="json" word-wrap />
            </div>
        </div>
    </n-modal>
  </div>
</template>
