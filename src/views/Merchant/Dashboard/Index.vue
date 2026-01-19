<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { NCard, NStatistic, NGrid, NGridItem, NSpin } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent])

const { t } = useI18n()

const loading = ref(true)
const stats = ref<any>({
    balance: 0,
    currency: 'USD',
    today_ggr: 0,
    active_players: 0,
    chart_data: []
})

const chartOption = computed(() => ({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
        type: 'category',
        boundaryGap: false,
        data: stats.value.chart_data.map((i: any) => i.date)
    },
    yAxis: { type: 'value' },
    series: [
        {
            name: 'GGR',
            type: 'line',
            data: stats.value.chart_data.map((i: any) => i.ggr),
            areaStyle: { opacity: 0.1 },
            smooth: true,
            itemStyle: { color: '#10b981' }
        }
    ]
}))

onMounted(async () => {
    try {
        const res = await fetch('/api/v2/agent/stats')
        const data = await res.json()
        if (data.code === 0) {
            stats.value = data.data
        }
    } finally {
        loading.value = false
    }
})
</script>

<template>
    <div class="p-6 space-y-6">
        <h1 class="text-2xl font-bold">{{ t('menu.dashboard') }}</h1>

        <n-spin :show="loading">
            <n-grid :x-gap="12" :y-gap="12" :cols="3">
                <n-grid-item>
                    <n-card>
                        <n-statistic :label="t('agent.myBalance')">
                            <template #prefix>{{ stats.currency }}</template>
                            {{ stats.balance?.toLocaleString() }}
                        </n-statistic>
                    </n-card>
                </n-grid-item>
                <n-grid-item>
                    <n-card>
                        <n-statistic :label="t('agent.todaysGGR')">
                            <template #prefix>{{ stats.currency }}</template>
                            <span :class="stats.today_ggr >= 0 ? 'text-green-600' : 'text-red-500'">
                                {{ stats.today_ggr?.toLocaleString() }}
                            </span>
                        </n-statistic>
                    </n-card>
                </n-grid-item>
                <n-grid-item>
                    <n-card>
                        <n-statistic :label="t('agent.activePlayers')">
                            {{ stats.active_players }}
                        </n-statistic>
                    </n-card>
                </n-grid-item>
                
                <n-grid-item :span="3">
                    <n-card :title="t('dashboard.revenueTrend')">
                        <div class="h-[350px]">
                            <v-chart class="chart" :option="chartOption" autoresize />
                        </div>
                    </n-card>
                </n-grid-item>
            </n-grid>
        </n-spin>
    </div>
</template>

<style scoped>
.chart {
    height: 100%;
    width: 100%;
}
</style>
