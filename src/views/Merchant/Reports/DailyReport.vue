<script setup lang="ts">
import { ref, onMounted, computed, h } from 'vue'
import { NDataTable, NButton, NSpace, NCard, NStatistic, NGrid, NGridItem } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import DateRangePicker from '../../../components/Common/DateRangePicker.vue'
import MoneyText from '../../../components/Common/MoneyText.vue'
import { renderHeaderWithTooltip } from '../../../utils/renderHelpers'



interface DailyReport {
    date: string
    currency: string
    total_bet: number
    total_win: number
    ggr: number
    round_count: number
    player_count: number
}

const loading = ref(false)
const list = ref<DailyReport[]>([])
const dateRange = ref<[number, number] | null>(null)

// Summary stats
const summary = computed(() => {
    return list.value.reduce((acc, row) => ({
        total_bet: acc.total_bet + row.total_bet,
        total_win: acc.total_win + row.total_win,
        total_ggr: acc.total_ggr + row.ggr,
        total_rounds: acc.total_rounds + row.round_count
    }), { total_bet: 0, total_win: 0, total_ggr: 0, total_rounds: 0 })
})

const columns = computed<DataTableColumns<DailyReport>>(() => [
    { 
        title: 'Date', 
        key: 'date', 
        width: 120,
        sorter: (a, b) => a.date.localeCompare(b.date)
    },
    { 
        title: 'Currency', 
        key: 'currency', 
        width: 100 
    },
    { 
        title: () => renderHeaderWithTooltip('Total Bet', 'tips.turnover_def'), 
        key: 'total_bet',
        width: 140,
        align: 'right',
        sorter: (a, b) => a.total_bet - b.total_bet,
        render: (row) => h(MoneyText, { value: row.total_bet, currency: row.currency })
    },
    { 
        title: () => renderHeaderWithTooltip('Total Win', 'tips.payout_def'), 
        key: 'total_win',
        width: 140,
        align: 'right',
        render: (row) => h(MoneyText, { value: row.total_win, currency: row.currency })
    },
    { 
        title: () => renderHeaderWithTooltip('GGR', 'tips.ggr_formula'), 
        key: 'ggr',
        width: 140,
        align: 'right',
        sorter: (a, b) => a.ggr - b.ggr,
        render: (row) => h('span', { class: 'font-bold' }, [
            h(MoneyText, { value: row.ggr, currency: row.currency })
        ])
    },
    { 
        title: 'Rounds', 
        key: 'round_count',
        width: 100,
        align: 'right',
        render: (row) => row.round_count.toLocaleString()
    },
    { 
        title: 'Players', 
        key: 'player_count',
        width: 100,
        align: 'right',
        render: (row) => row.player_count.toLocaleString()
    }
])

const fetchData = async () => {
    loading.value = true
    try {
        const res = await fetch('/api/v2/agent/report/daily', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                date_start: dateRange.value?.[0],
                date_end: dateRange.value?.[1]
            })
        })
        const data = await res.json()
        list.value = data.data?.list || []
    } finally {
        loading.value = false
    }
}

const handleExport = () => {
    // TODO: Implement CSV export
    alert('Export feature coming soon')
}

onMounted(() => fetchData())
</script>

<template>
    <div class="p-6 space-y-4">
        <div class="flex justify-between items-center">
            <h1 class="text-2xl font-bold flex items-center gap-2">
                <span>📅</span> Daily Report
            </h1>
        </div>

        <!-- Date Filter -->
        <n-card size="small">
            <div class="flex items-center justify-between">
                <DateRangePicker v-model:value="dateRange" />
                <n-space>
                    <n-button type="primary" @click="fetchData" :loading="loading">
                        🔍 Search
                    </n-button>
                    <n-button @click="handleExport" secondary>
                        📥 Export CSV
                    </n-button>
                </n-space>
            </div>
        </n-card>

        <!-- Summary Cards -->
        <n-grid :x-gap="12" :y-gap="12" :cols="4">
            <n-grid-item>
                <n-card size="small">
                    <n-statistic label="Total Bet">
                        <MoneyText :value="summary.total_bet" currency="USD" />
                    </n-statistic>
                </n-card>
            </n-grid-item>
            <n-grid-item>
                <n-card size="small">
                    <n-statistic label="Total Win">
                        <MoneyText :value="summary.total_win" currency="USD" />
                    </n-statistic>
                </n-card>
            </n-grid-item>
            <n-grid-item>
                <n-card size="small">
                    <n-statistic label="Total GGR">
                        <MoneyText :value="summary.total_ggr" currency="USD" />
                    </n-statistic>
                </n-card>
            </n-grid-item>
            <n-grid-item>
                <n-card size="small">
                    <n-statistic label="Total Rounds" :value="summary.total_rounds" />
                </n-card>
            </n-grid-item>
        </n-grid>

        <!-- Data Table -->
        <n-card>
            <n-data-table 
                :columns="columns" 
                :data="list" 
                :loading="loading" 
                :pagination="{ pageSize: 10 }"
                striped
            />
        </n-card>
    </div>
</template>
