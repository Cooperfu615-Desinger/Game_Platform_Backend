<script setup lang="ts">
import { ref, h, onMounted } from 'vue'
import {
  NCard, NInput, NDatePicker, NSelect, NButton,
  NDataTable, NTag, NModal, NCode, NSpace
} from 'naive-ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DataTableColumns } from 'naive-ui'
import { useRoundSearch } from '../../composables/useRoundSearch'
import type { BetLog } from '../../types/report'

// Reusing composable logic but will enhance local UI state
const { t } = useI18n()
const { loading, searchModel, logs, handleSearch } = useRoundSearch()

// Initialize Search Model
onMounted(() => {
    handleSearch()
})

// Detailed Filters
const gameOptions = computed(() => [
    { label: t('common.all'), value: '' },
    { label: 'Fortune Tiger', value: 'Fortune Tiger' },
    { label: 'Super Ace', value: 'Super Ace' },
    { label: 'Gates of Olympus', value: 'Gates of Olympus' },
    { label: 'Sugar Rush', value: 'Sugar Rush' }
])

const statusOptions = computed(() => [
    { label: t('common.all'), value: '' },
    { label: t('status.win'), value: 'win' },
    { label: t('status.loss'), value: 'loss' },
    { label: t('status.refund'), value: 'refund' }
])

// Modal State
const showDetail = ref(false)
const detailedLog = ref<BetLog | null>(null)
const jsonContent = ref('')

const openDetail = (row: BetLog) => {
    detailedLog.value = row
    jsonContent.value = JSON.stringify(row.game_detail, null, 2)
    showDetail.value = true
}

// Columns
// Columns
const columns = computed<DataTableColumns<BetLog>>(() => [
    { 
        title: t('betLog.time'), 
        key: 'created_at', 
        width: 180,
        sorter: (row1, row2) => new Date(row1.created_at).getTime() - new Date(row2.created_at).getTime(),
        render: (row) => new Date(row.created_at).toLocaleString() 
    },
    { 
        title: t('betLog.roundId'), 
        key: 'id', 
        width: 140, 
        ellipsis: true,
        render: (row) => h(
            'span', 
            { 
                class: 'text-primary cursor-pointer hover:underline',
                onClick: () => openDetail(row)
            }, 
            row.id
        ) 
    },
    { title: t('columns.account'), key: 'player_account', width: 120 },
    { title: t('betLog.game'), key: 'game_name', width: 140 },
    { 
        title: t('betLog.bet'), 
        key: 'bet_amount', 
        width: 100,
        sorter: (row1, row2) => row1.bet_amount - row2.bet_amount,
        render: (row) => row.bet_amount.toFixed(2)
    },
    { 
        title: t('betLog.win'), 
        key: 'win_amount', 
        width: 100,
        sorter: (row1, row2) => row1.win_amount - row2.win_amount,
        render: (row) => h(
            'span',
            { class: row.win_amount > 0 ? 'text-green-400 font-bold' : 'text-gray-500' },
            row.win_amount.toFixed(2)
        )
    },
    { 
        title: t('betLog.payout'), 
        key: 'payout', 
        width: 100,
        sorter: (row1, row2) => row1.payout - row2.payout,
        render: (row) => {
            const isBigWin = row.payout >= 100
            return h(NSpace, { align: 'center', size: 4 }, {
                default: () => [
                    isBigWin ? '🔥' : '',
                    row.payout.toFixed(2) + 'x'
                ]
            })
        }
    },
    {
        title: t('common.status'),
        key: 'status',
        width: 100,
        render: (row) => {
            const map: Record<string, 'success' | 'error' | 'warning'> = {
                win: 'success',
                loss: 'error',
                refund: 'warning'
            }
            return h(
                NTag,
                { type: map[row.status] || 'default', bordered: false, size: 'small' },
                { default: () => t(`status.${row.status}`).toUpperCase() }
            )
        }
    },
    {
        title: t('common.action'),
        key: 'actions',
        width: 100,
        render: (row) => h(
            NButton,
            { size: 'small', secondary: true, onClick: () => openDetail(row) },
            { default: () => t('common.viewDetail') }
        )
    }
])
</script>

<template>
  <div class="p-6 space-y-4">
    <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold">{{ t('betLog.title') }}</h1>
        <n-button type="primary" dashed @click="handleSearch">{{ t('common.refresh') }}</n-button>
    </div>

    <!-- Advanced Filter Bar -->
    <n-card size="small">
        <n-space vertical size="medium">
            <n-space>
                <n-date-picker 
                    v-model:value="searchModel.timeRange" 
                    type="datetimerange" 
                    clearable 
                    :placeholder="t('betLog.timeRange')"
                    style="width: 340px"
                />
                <n-input 
                    v-model:value="searchModel.playerId" 
                    :placeholder="t('betLog.playerAccount')" 
                    style="width: 200px"
                />
                 <n-input 
                    v-model:value="searchModel.roundId" 
                    :placeholder="t('betLog.roundId')" 
                    style="width: 160px"
                />
            </n-space>
            <n-space>
                <n-select 
                    :placeholder="t('betLog.selectGame')" 
                    :options="gameOptions" 
                    clearable 
                    style="width: 200px" 
                />
                <n-select 
                    :placeholder="t('common.status')" 
                    :options="statusOptions" 
                    clearable 
                    style="width: 150px" 
                />
                 <n-button type="primary" @click="handleSearch" :loading="loading">
                    {{ t('betLog.searchLogs') }}
                </n-button>
            </n-space>
        </n-space>
    </n-card>

    <!-- Data Table -->
    <n-data-table
        :columns="columns"
        :data="logs"
        :loading="loading"
        :pagination="{ pageSize: 15 }"
        class="bg-[#18181c] rounded-lg"
    />

    <!-- JSON Inspector Modal -->
    <n-modal v-model:show="showDetail" preset="card" :title="`${t('betLog.roundDetail')}: ${detailedLog?.id}`" style="width: 800px">
        <div class="grid grid-cols-3 gap-4 h-[500px]">
            <!-- Left: Info Panel -->
            <div class="col-span-1 bg-gray-800 p-4 rounded space-y-4">
                <h3 class="font-bold text-lg border-b pb-2 border-gray-700">{{ t('betLog.summary') }}</h3>
                
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <span class="text-gray-400">{{ t('betLog.game') }}:</span>
                    <span>{{ detailedLog?.game_name }}</span>
                    
                    <span class="text-gray-400">{{ t('betLog.bet') }}:</span>
                    <span>{{ detailedLog?.bet_amount }}</span>
                    
                    <span class="text-gray-400">{{ t('betLog.win') }}:</span>
                    <span :class="detailedLog?.win_amount! > 0 ? 'text-green-400' : ''">
                        {{ detailedLog?.win_amount }}
                    </span>

                    <span class="text-gray-400">{{ t('betLog.payout') }}:</span>
                    <span>{{ detailedLog?.payout }}x</span>
                </div>
                
                <div v-if="detailedLog?.payout! >= 100" class="bg-red-900/30 p-2 rounded text-center border border-red-900">
                    <span class="text-xl">🔥 {{ t('betLog.bigWin') }}</span>
                </div>
                <div v-if="detailedLog?.game_detail.free_games_triggered" class="bg-blue-900/30 p-2 rounded text-center border border-blue-900">
                    <span class="text-blue-300">{{ t('betLog.freeGame') }}</span>
                </div>
            </div>

            <!-- Right: JSON Code -->
            <div class="col-span-2 bg-[#1e1e1e] p-4 rounded overflow-auto relative font-mono text-xs">
                 <n-code :code="jsonContent" language="json" word-wrap />
            </div>
        </div>
    </n-modal>
  </div>
</template>
