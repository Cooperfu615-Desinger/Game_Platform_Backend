<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { 
    NCard, NStatistic, NGrid, NGridItem, NDataTable, NButton, NTag, useMessage, NDatePicker
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import TransactionDetailDrawer from './components/TransactionDetailDrawer.vue'

const { t } = useI18n()
const message = useMessage()
const loading = ref(false)

// State
const dateRange = ref<[number, number]>([
    new Date().setDate(new Date().getDate() - 30),
    new Date().getTime()
])

interface DailyReportItem {
    date: string
    tx_count: number
    total_bet: number
    total_payout: number
    net_win: number
    rtp: number
}

const items = ref<DailyReportItem[]>([])
const summary = ref({
    total_bet: 0,
    total_payout: 0,
    net_win: 0,
    tx_count: 0,
    rtp: 0
})

// Drawer State
const showDrawer = ref(false)
const selectedDate = ref('')

// Fetch Data
const fetchData = async () => {
    loading.value = true
    try {
        const [start, end] = dateRange.value
        const startDate = new Date(start).toISOString().split('T')[0]
        const endDate = new Date(end).toISOString().split('T')[0]

        const res = await fetch(`/api/v2/merchant/reports/daily?startDate=${startDate}&endDate=${endDate}`)
        const data = await res.json()
        
        if (data.code === 0) {
            items.value = data.data.items
            summary.value = data.data.summary
        }
    } catch {
        message.error('Failed to load report')
    } finally {
        loading.value = false
    }
}

const handleViewDetails = (date: string) => {
    selectedDate.value = date
    showDrawer.value = true
}

const columns: DataTableColumns<DailyReportItem> = [
    {
        title: t('merchantReports.dailySummary'), // Date
        key: 'date',
        sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    },
    {
        title: t('merchantReports.txCount'),
        key: 'tx_count',
        sorter: (a, b) => a.tx_count - b.tx_count,
        align: 'right'
    },
    {
        title: t('merchantReports.totalBet'),
        key: 'total_bet',
        sorter: (a, b) => a.total_bet - b.total_bet,
        align: 'right',
        render: (row) => row.total_bet.toFixed(2)
    },
    {
        title: t('merchantReports.totalPayout'),
        key: 'total_payout',
        sorter: (a, b) => a.total_payout - b.total_payout,
        align: 'right',
        render: (row) => row.total_payout.toFixed(2)
    },
    {
        title: t('merchantReports.netWin'),
        key: 'net_win',
        sorter: (a, b) => a.net_win - b.net_win,
        align: 'right',
        render: (row) => {
            const val = row.net_win
            return h(
                'span',
                { class: val >= 0 ? 'text-green-500 font-bold' : 'text-red-500 font-bold' },
                val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2)
            )
        }
    },
    {
        title: t('merchantReports.avgRtp'),
        key: 'rtp',
        sorter: (a, b) => a.rtp - b.rtp,
        align: 'right',
        render: (row) => h(
            NTag,
            { type: row.rtp > 100 ? 'error' : 'success', bordered: false, size: 'small' },
            { default: () => `${row.rtp}%` }
        )
    },
    {
        title: '',
        key: 'actions',
        width: 100,
        render: (row) => h(
            NButton,
            {
                size: 'small',
                secondary: true,
                onClick: () => handleViewDetails(row.date)
            },
            { default: () => t('merchantReports.viewDetails') }
        )
    }
]

onMounted(fetchData)
</script>

<template>
    <div class="p-6 space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-2xl font-bold flex items-center gap-2">
                <span>📈</span> {{ t('merchantReports.title') }}
            </h1>
            <n-date-picker 
                v-model:value="dateRange" 
                type="daterange" 
                clearable 
                @update:value="fetchData" 
            />
        </div>

        <!-- Summary Cards -->
        <n-card :title="t('merchantReports.summaryTitle')" size="small">
            <n-grid :cols="4" gap="12">
                <n-grid-item>
                    <n-statistic :label="t('merchantReports.totalBet')">
                        {{ summary.total_bet.toLocaleString() }}
                    </n-statistic>
                </n-grid-item>
                <n-grid-item>
                    <n-statistic :label="t('merchantReports.totalPayout')">
                        {{ summary.total_payout.toLocaleString() }}
                    </n-statistic>
                </n-grid-item>
                <n-grid-item>
                    <n-statistic :label="t('merchantReports.netWin')">
                        <template #default>
                            <span :class="summary.net_win >= 0 ? 'text-green-500' : 'text-red-500'">
                                {{ summary.net_win > 0 ? '+' : '' }}{{ summary.net_win.toLocaleString() }}
                            </span>
                        </template>
                    </n-statistic>
                </n-grid-item>
                <n-grid-item>
                    <n-statistic :label="t('merchantReports.avgRtp')">
                        <span :class="summary.rtp > 100 ? 'text-red-500' : 'text-green-500'">
                            {{ summary.rtp }}%
                        </span>
                    </n-statistic>
                </n-grid-item>
            </n-grid>
        </n-card>

        <n-data-table
            :columns="columns"
            :data="items"
            :loading="loading"
            :pagination="{ pageSize: 10 }"
            :row-key="(row) => row.date"
            striped
        />

        <TransactionDetailDrawer
            v-model:show="showDrawer"
            :date="selectedDate"
        />
    </div>
</template>
