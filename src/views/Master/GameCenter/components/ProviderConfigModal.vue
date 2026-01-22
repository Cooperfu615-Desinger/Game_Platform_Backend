<script setup lang="ts">
import { ref, watch } from 'vue'
import { 
    NModal, NTabs, NTabPane, NForm, NFormItem, 
    NInput, NButton, NSelect, NInputNumber,
    useMessage, NDatePicker, NIcon, NSwitch, NCard, NTooltip
} from 'naive-ui'
import { SettingsOutlined, InfoOutlined } from '@vicons/material'
import { useI18n } from 'vue-i18n'
import type { Provider } from '../../../../types/provider'
import MaintenanceSettingsModal from './MaintenanceSettingsModal.vue'

const props = defineProps<{
    show: boolean
    provider: Provider | null
}>()

const emit = defineEmits<{
    (e: 'update:show', value: boolean): void
    (e: 'refresh'): void
}>()

const { t } = useI18n()
const message = useMessage()
const loading = ref(false)
const showMaintenance = ref(false)

const formModel = ref<Partial<Provider>>({
    apiConfig: {},
    contract: {
        costPercent: 0,
        expiryDate: Date.now()
    },
    contractConfig: {
        settlement_currency: 'USD',
        rules: {
            slot_free_spin: { enabled: false, provider_share: 0 },
            live_tip: { enabled: false, provider_share: 0 },
            card_fee: { enabled: false, provider_share: 0 }
        }
    }
})

// Deep copy provider data when modal opens
watch(() => props.show, (newVal) => {
    if (newVal && props.provider) {
        formModel.value = JSON.parse(JSON.stringify(props.provider))
        if (!formModel.value.apiConfig) {
            formModel.value.apiConfig = {}
        }
        if (!formModel.value.contract) {
            formModel.value.contract = {
                costPercent: 0,
                expiryDate: Date.now()
            }
        }
        if (!formModel.value.contractConfig) {
            formModel.value.contractConfig = {
                settlement_currency: 'USD',
                rules: {
                    slot_free_spin: { enabled: false, provider_share: 0 },
                    live_tip: { enabled: false, provider_share: 0 },
                    card_fee: { enabled: false, provider_share: 0 }
                }
            }
        }
    }
})

const currencyOptions = [
    { label: 'USD', value: 'USD' },
    { label: 'EUR', value: 'EUR' },
    { label: 'CNY', value: 'CNY' },
    { label: 'TWD', value: 'TWD' }
]

const handleClose = () => {
    emit('update:show', false)
}

const handleSave = async () => {
    loading.value = true
    try {
        const response = await fetch('/api/v2/providers/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formModel.value)
        })
        
        if (!response.ok) throw new Error('API Error')
        
        message.success(t('merchantConfig.saveSuccess'))
        handleClose()
        emit('refresh')
    } catch (e) {
        message.error('Error saving provider config')
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <n-modal
        :show="show"
        @update:show="$emit('update:show', $event)"
        class="w-[600px]"
        preset="card"
        :title="`${t('provider.config')} - ${provider?.name}`"
        :bordered="false"
        size="huge"
    >
        <template #header-extra>
            <n-button size="small" secondary type="warning" @click="showMaintenance = true">
                <template #icon>
                    <n-icon :component="SettingsOutlined" />
                </template>
                {{ t('provider.maintenanceSchedule') }}
            </n-button>
        </template>

        <n-tabs type="line" animated>
            <!-- Tab 1: API Connection -->
            <n-tab-pane name="integration" :tab="t('provider.integration')">
                <n-form
                    label-placement="left"
                    label-width="160"
                    require-mark-placement="right-hanging"
                    class="mt-4"
                >
                    <n-form-item :label="t('provider.apiUrl')">
                        <n-input v-model:value="formModel.apiConfig!.apiUrl" placeholder="https://api.provider.com" />
                    </n-form-item>

                    <n-form-item :label="t('provider.merchantCode')">
                        <n-input v-model:value="formModel.apiConfig!.merchantCode" />
                    </n-form-item>

                    <n-form-item :label="t('provider.secretKey')">
                         <n-input 
                            v-model:value="formModel.apiConfig!.secretKey" 
                            type="password" 
                            show-password-on="click" 
                        />
                    </n-form-item>
                </n-form>
            </n-tab-pane>

            <!-- Tab 2: Contract & Finance -->
            <n-tab-pane name="contract" :tab="t('provider.contract')">
                <n-form
                    label-placement="left"
                    label-width="160"
                    require-mark-placement="right-hanging"
                    class="mt-4"
                >
                    <!-- Settlement Currency -->
                    <n-form-item :label="t('provider.settlementCurrency')">
                        <n-select 
                            v-model:value="formModel.contractConfig!.settlement_currency" 
                            :options="currencyOptions" 
                        />
                    </n-form-item>

                    <!-- Revenue Share (Base) -->
                    <n-form-item :label="t('provider.revenueShare')">
                        <n-input-number 
                            v-model:value="formModel.apiConfig!.revenueShare" 
                            :min="0" 
                            :max="100"
                        >
                            <template #suffix>%</template>
                        </n-input-number>
                    </n-form-item>

                    <!-- Advanced Rules -->
                    <n-card :title="t('provider.advancedRules')" size="small" class="mt-4 bg-gray-50 border-gray-200">
                        <!-- Slot Free Spin -->
                        <div class="mb-4 pb-4 border-b border-gray-200">
                            <div class="flex justify-between items-center mb-2">
                                <div class="font-medium flex items-center gap-2">
                                    {{ t('provider.rules.slotFreeSpin') }}
                                    <n-tooltip trigger="hover">
                                        <template #trigger><n-icon :component="InfoOutlined" class="text-gray-400 cursor-pointer" /></template>
                                        {{ t('provider.rules.slotHelp') }}
                                    </n-tooltip>
                                </div>
                                <n-switch v-model:value="formModel.contractConfig!.rules.slot_free_spin.enabled" />
                            </div>
                            <div v-if="formModel.contractConfig!.rules.slot_free_spin.enabled" class="flex gap-4 items-center pl-6">
                                <n-form-item :label="t('provider.rules.providerShare')" :show-label="true" label-placement="left" class="mb-0">
                                    <n-input-number v-model:value="formModel.contractConfig!.rules.slot_free_spin.provider_share" :min="0" :max="100" size="small">
                                        <template #suffix>%</template>
                                    </n-input-number>
                                </n-form-item>
                                <div class="text-gray-500 text-sm">
                                    {{ t('provider.rules.aggregatorShare') }}: 
                                    <span class="font-bold text-primary">{{ 100 - (formModel.contractConfig?.rules.slot_free_spin.provider_share || 0) }}%</span>
                                </div>
                            </div>
                        </div>

                        <!-- Live Tip -->
                        <div class="mb-4 pb-4 border-b border-gray-200">
                            <div class="flex justify-between items-center mb-2">
                                <div class="font-medium flex items-center gap-2">
                                    {{ t('provider.rules.liveTip') }}
                                </div>
                                <n-switch v-model:value="formModel.contractConfig!.rules.live_tip.enabled" />
                            </div>
                            <div v-if="formModel.contractConfig!.rules.live_tip.enabled" class="flex gap-4 items-center pl-6">
                                <n-form-item :label="t('provider.rules.providerShare')" :show-label="true" label-placement="left" class="mb-0">
                                    <n-input-number v-model:value="formModel.contractConfig!.rules.live_tip.provider_share" :min="0" :max="100" size="small">
                                        <template #suffix>%</template>
                                    </n-input-number>
                                </n-form-item>
                                <div class="text-gray-500 text-sm">
                                    {{ t('provider.rules.aggregatorShare') }}: 
                                    <span class="font-bold text-primary">{{ 100 - (formModel.contractConfig?.rules.live_tip.provider_share || 0) }}%</span>
                                </div>
                            </div>
                        </div>

                        <!-- Card Fee -->
                        <div>
                            <div class="flex justify-between items-center mb-2">
                                <div class="font-medium flex items-center gap-2">
                                    {{ t('provider.rules.cardFee') }}
                                </div>
                                <n-switch v-model:value="formModel.contractConfig!.rules.card_fee.enabled" />
                            </div>
                            <div v-if="formModel.contractConfig!.rules.card_fee.enabled" class="flex gap-4 items-center pl-6">
                                <n-form-item :label="t('provider.rules.providerShare')" :show-label="true" label-placement="left" class="mb-0">
                                    <n-input-number v-model:value="formModel.contractConfig!.rules.card_fee.provider_share" :min="0" :max="100" size="small">
                                        <template #suffix>%</template>
                                    </n-input-number>
                                </n-form-item>
                                <div class="text-gray-500 text-sm">
                                    {{ t('provider.rules.aggregatorShare') }}: 
                                    <span class="font-bold text-primary">{{ 100 - (formModel.contractConfig?.rules.card_fee.provider_share || 0) }}%</span>
                                </div>
                            </div>
                        </div>
                    </n-card>

                    <!-- Expiry Date (Existing) -->
                    <n-form-item :label="t('provider.expiryDate')" class="mt-4">
                        <n-date-picker 
                            v-model:value="formModel.contract!.expiryDate as number" 
                            type="date"
                            class="w-full"
                        />
                    </n-form-item>
                </n-form>
            </n-tab-pane>
        </n-tabs>

        <div class="flex justify-end gap-3 mt-6 border-t border-gray-700 pt-4">
            <n-button @click="handleClose" :disabled="loading">{{ t('common.cancel') }}</n-button>
            <n-button type="primary" @click="handleSave" :loading="loading">{{ t('common.save') }}</n-button>
        </div>

        <maintenance-settings-modal
            v-model:show="showMaintenance"
            :provider="provider"
            @refresh="$emit('refresh')"
        />
    </n-modal>
</template>
