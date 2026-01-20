<script setup lang="ts">
import { onMounted, h, computed } from 'vue'
import { NDataTable, NTag, NAlert, NButton, NSpace } from 'naive-ui'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ref } from 'vue'

import type { DataTableColumns } from 'naive-ui'
import type { Merchant } from '../../../types/merchant'
import { useMerchantList } from '../../../composables/useMerchantList'
import MerchantConfigModal from './components/MerchantConfigModal.vue'
import MerchantSubscriptionModal from './components/MerchantSubscriptionModal.vue'
import MoneyText from '../../../components/Common/MoneyText.vue'
import StatusBadge from '../../../components/Common/StatusBadge.vue'

const { list, loading, error, fetchList } = useMerchantList()
const router = useRouter()
const { t } = useI18n()

const showConfig = ref(false)
const showSubscription = ref(false)
const currentMerchant = ref<Merchant | null>(null)

const handleConfig = (row: Merchant) => {
    currentMerchant.value = row
    showConfig.value = true
}

const handleSubscription = (row: Merchant) => {
    currentMerchant.value = row
    showSubscription.value = true
}

onMounted(() => {
  fetchList({ level: 1 }) // Default Level 1
})

const columns = computed<DataTableColumns<Merchant>>(() => [
    {
      title: t('columns.id'),
      key: 'id',
      width: 80,
      sorter: (row1, row2) => row1.id - row2.id
    },
    {
      title: t('merchant.merchantId'), // Merchant ID
      key: 'account',
      width: 150,
      sorter: (row1, row2) => row1.account.localeCompare(row2.account)
    },
    {
      title: t('merchant.siteCodeLabel'), // Merchant Code (Renamed to Merchant Name)
      key: 'site_code',
      width: 130,
      sorter: (row1, row2) => row1.site_code.localeCompare(row2.site_code)
    },
    {
      title: t('merchant.name'),
      key: 'name',
      width: 180,
      sorter: (row1, row2) => row1.name.localeCompare(row2.name)
    },
    {
      title: t('merchantConfig.walletMode'),
      key: 'walletMode',
      width: 120,
      render(row) {
        return h(
          NTag,
          {
            type: row.walletMode === 'seamless' ? 'success' : 'info',
            bordered: false,
            size: 'small'
          },
          { default: () => row.walletMode === 'seamless' ? t('merchantConfig.seamless') : t('merchantConfig.transfer') }
        )
      }
    },
    {
      title: t('merchant.currency'),
      key: 'currency_type',
      width: 130,
      sorter: (row1, row2) => row1.currency_type.localeCompare(row2.currency_type)
    },
    {
      title: t('agent.percent'),
      key: 'percent',
      width: 100,
      sorter: (row1, row2) => row1.percent - row2.percent,
      render(row) {
        return `${row.percent}%`
      }
    },
    {
      title: t('columns.state'),
      key: 'state',
      width: 100,
      sorter: (row1, row2) => row1.state - row2.state,
      render(row) {
        return h(StatusBadge, {
          status: row.state === 1 ? 'Active' : 'Suspended'
        })
      }
    },
    {
      title: t('columns.balance'),
      key: 'balance',
      width: 120,
      render(row) {
        // Only show balance for Transfer wallet mode
        if (row.walletMode === 'transfer' && row.balance !== undefined) {
          return h(MoneyText, {
            value: row.balance,
            currency: row.currency_type || 'USD'
          })
        }
        return h('span', { class: 'text-gray-500' }, '-')
      }
    },
    {
      title: t('columns.createdAt'),
      key: 'created_at',
      width: 200,
      sorter: (row1, row2) => new Date(row1.created_at).getTime() - new Date(row2.created_at).getTime(),
      render(row) {
        return new Date(row.created_at).toLocaleString()
      }
    },
    {
        title: t('common.action'),
        key: 'actions',
        width: 180,
        fixed: 'right',
        render: (row) => h(NSpace, { size: 'small' }, {
            default: () => [
                h(NButton, {
                    size: 'small',
                    onClick: () => handleConfig(row)
                }, { default: () => t('merchantConfig.config') }),
                h(NButton, {
                    size: 'small',
                    secondary: true,
                    type: 'info',
                    onClick: () => handleSubscription(row)
                }, { default: () => '🎮' })
            ]
        })
    }
])


</script>

<template>
  <div class="p-6 space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">{{ t('merchant.listTitle') }}</h1>
      <n-button type="primary" @click="router.push('/merchant/create')">
        + {{ t('merchant.create') }}
      </n-button>
    </div>

    <!-- Debug Alert -->
    <n-alert type="error" v-if="error" title="Data Load Error">
      {{ error }}
    </n-alert>

    <n-data-table
      :columns="columns"
      :data="list"
      :loading="loading"
      :pagination="false"
      class="mt-4"
    />

    <merchant-config-modal 
        v-model:show="showConfig" 
        :merchant-id="currentMerchant?.id || null"
        @refresh="fetchList"
    />

    <merchant-subscription-modal
        v-model:show="showSubscription"
        :merchant-id="currentMerchant?.id || null"
    />
  </div>
</template>
