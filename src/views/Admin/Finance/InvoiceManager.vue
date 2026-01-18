<script setup lang="ts">
import { ref, onMounted, computed, h } from 'vue'
import { 
    NCard, NButton, NDataTable, NTag, NModal, NDatePicker, 
    NSpace, NStatistic, NDrawer, NDrawerContent, NList, NListItem,
    useMessage, type DataTableColumns 
} from 'naive-ui'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const message = useMessage()

// Models
interface Invoice {
    id: string
    merchant_id: number
    merchant_name: string
    period: string
    total_ggr: number
    commission_rate: number
    amount_due: number
    status: 'pending' | 'paid'
    breakdown?: any[]
}

// State
const invoices = ref<Invoice[]>([])
const loading = ref(false)
const showGenerateModal = ref(false)
const showDetailDrawer = ref(false)
const selectedInvoice = ref<Invoice | null>(null)
const generateDate = ref<number | null>(Date.now())
const previewData = ref<any[]>([])
const generating = ref(false)

// Formatting
const formatCurrency = (val: number) => `$${val.toLocaleString()}`

// Columns
const columns = computed<DataTableColumns<Invoice>>(() => [
    { title: 'ID', key: 'id' },
    { title: t('finance.merchant'), key: 'merchant_name' },
    { title: t('finance.period'), key: 'period' },
    { 
        title: t('finance.totalGGR'), 
        key: 'total_ggr', 
        align: 'right',
        render: (row) => formatCurrency(row.total_ggr)
    },
    { 
        title: t('finance.amountDue'), 
        key: 'amount_due', 
        align: 'right',
        render: (row) =>  h('span', { class: 'font-bold' }, formatCurrency(row.amount_due))
    },
    { 
        title: t('finance.status'), 
        key: 'status',
        render: (row) => h(
            NTag, 
            { type: row.status === 'paid' ? 'success' : 'warning', bordered: false }, 
            { default: () => t(`finance.${row.status}`) }
        )
    },
    {
        title: 'Action',
        key: 'action',
        render: (row) => h(
            NButton, 
            { 
                size: 'small', 
                onClick: () => openDetail(row) 
            }, 
            { default: () => 'Detail' }
        )
    }
])

const previewColumns = [
    { title: t('finance.merchant'), key: 'merchant_name' },
    { title: 'GGR', key: 'total_ggr', render: (row: any) => formatCurrency(row.total_ggr) },
    { title: 'Rate', key: 'commission_rate', render: (row: any) => row.commission_rate + '%' },
    { title: 'Bill', key: 'amount_due', render: (row: any) => formatCurrency(row.amount_due) }
]

// Actions
const fetchInvoices = async () => {
    loading.value = true
    try {
        const res = await fetch('/api/v2/finance/invoices')
        const data = await res.json()
        invoices.value = data.data.list
    } finally {
        loading.value = false
    }
}

const handlePreview = async () => {
    if (!generateDate.value) return
    const date = new Date(generateDate.value)
    const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    generating.value = true
    try {
        const res = await fetch('/api/v2/finance/invoices/preview', {
            method: 'POST',
            body: JSON.stringify({ month: monthStr })
        })
        const data = await res.json()
        previewData.value = data.data
    } finally {
        generating.value = false
    }
}

const confirmGenerate = async () => {
    if (!generateDate.value || previewData.value.length === 0) return
    const date = new Date(generateDate.value)
    const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    generating.value = true
    try {
        const res = await fetch('/api/v2/finance/invoices/generate', {
            method: 'POST',
            body: JSON.stringify({ month: monthStr, items: previewData.value })
        })
        const data = await res.json()
        if (data.code === 0) {
            message.success('Invoices generated successfully')
            showGenerateModal.value = false
            fetchInvoices()
        }
    } finally {
        generating.value = false
    }
}

const openDetail = (invoice: Invoice) => {
    selectedInvoice.value = invoice
    showDetailDrawer.value = true
}

const markAsPaid = async () => {
    if (!selectedInvoice.value) return
    try {
        const res = await fetch(`/api/v2/finance/invoices/${selectedInvoice.value.id}/pay`, { method: 'POST' })
        const data = await res.json()
        if (data.code === 0) {
            message.success('Marked as paid')
            selectedInvoice.value.status = 'paid'
            fetchInvoices() // Refresh list
        }
    } catch (e) {
        message.error('Operation failed')
    }
}

onMounted(() => {
    fetchInvoices()
})
</script>

<template>
    <div class="p-6 space-y-4">
        <div class="flex justify-between items-center">
            <h1 class="text-2xl font-bold">{{ t('finance.invoiceManager') }}</h1>
            <n-button type="primary" @click="showGenerateModal = true">
                {{ t('finance.generateInvoice') }}
            </n-button>
        </div>

        <n-card>
            <n-data-table 
                :columns="columns" 
                :data="invoices" 
                :loading="loading" 
                :pagination="{ pageSize: 10 }" 
            />
        </n-card>

        <!-- Generate Modal -->
        <n-modal v-model:show="showGenerateModal" preset="card" :title="t('finance.generateInvoice')" class="w-[600px]">
            <n-space vertical size="large">
                <div class="flex items-center gap-4">
                    <span>{{ t('finance.period') }}:</span>
                    <n-date-picker v-model:value="generateDate" type="month" clearable />
                    <n-button @click="handlePreview" :loading="generating">Preview</n-button>
                </div>

                <div v-if="previewData.length > 0" class="border rounded p-4 bg-gray-50/5">
                    <n-data-table size="small" :columns="previewColumns" :data="previewData" max-height="300" />
                    <div class="flex justify-end mt-4 font-bold text-lg">
                        Total: {{ formatCurrency(previewData.reduce((acc, curr) => acc + curr.amount_due, 0)) }}
                    </div>
                </div>

                <div class="flex justify-end gap-2">
                    <n-button @click="showGenerateModal = false">Cancel</n-button>
                    <n-button type="primary" :disabled="previewData.length === 0" @click="confirmGenerate" :loading="generating">
                        {{ t('finance.confirmGenerate') }}
                    </n-button>
                </div>
            </n-space>
        </n-modal>

        <!-- Detail Drawer -->
        <n-drawer v-model:show="showDetailDrawer" :width="500">
            <n-drawer-content :title="selectedInvoice?.id">
                <div v-if="selectedInvoice" class="space-y-6">
                    <n-card :bordered="false" class="bg-gray-50/5">
                        <n-statistic :label="t('finance.amountDue')" :value="selectedInvoice.amount_due">
                            <template #prefix>$</template>
                        </n-statistic>
                        <div class="mt-2 flex gap-2">
                             <n-tag :type="selectedInvoice.status === 'paid' ? 'success' : 'warning'">
                                {{ t(`finance.${selectedInvoice.status}`) }}
                            </n-tag>
                             <span class="text-gray-400">{{ selectedInvoice.period }}</span>
                        </div>
                    </n-card>

                    <div>
                        <h3 class="font-bold mb-2">{{ t('finance.breakdown') }}</h3>
                        <n-list bordered>
                            <n-list-item v-for="(item, i) in selectedInvoice.breakdown" :key="i">
                                <div class="flex justify-between">
                                    <span>{{ item.provider }}</span>
                                    <span>{{ formatCurrency(item.amount) }}</span>
                                </div>
                                <div class="text-xs text-gray-500">
                                    GGR: {{ formatCurrency(item.ggr) }} @ {{ item.rate }}%
                                </div>
                            </n-list-item>
                        </n-list>
                    </div>

                    <div v-if="selectedInvoice.status === 'pending'" class="flex justify-end">
                        <n-button type="success" size="large" @click="markAsPaid">
                            {{ t('finance.markAsPaid') }}
                        </n-button>
                    </div>
                </div>
            </n-drawer-content>
        </n-drawer>
    </div>
</template>
