<script setup lang="ts">
import { ref, watch } from 'vue'
import { 
    NModal, NTabs, NTabPane, NForm, NFormItem, 
    NRadioGroup, NRadioButton, NInput, NInputGroup, 
    NButton, NSelect, NDynamicTags, NSwitch, useMessage
} from 'naive-ui'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
    show: boolean
    merchantId: number | null
}>()

const emit = defineEmits<{
    (e: 'update:show', value: boolean): void
    (e: 'refresh'): void
}>()

const { t } = useI18n()
const message = useMessage()
const loading = ref(false)

// Form State
const formModel = ref({
    wallet_mode: 'transfer',
    api_key: '',
    secret_key: '',
    callback_url: '',
    currency: 'CNY',
    allowed_ips: [] as string[],
    state: true
})

const currencyOptions = [
    { label: 'CNY', value: 'CNY' },
    { label: 'USD', value: 'USD' },
    { label: 'TWD', value: 'TWD' },
    { label: 'THB', value: 'THB' },
    { label: 'VND', value: 'VND' }
]

// Mock Data Load
watch(() => props.show, (newVal) => {
    if (newVal && props.merchantId) {
        // Mock fetch API call
        formModel.value = {
            wallet_mode: 'transfer',
            api_key: 'mk_' + Math.random().toString(36).substring(7),
            secret_key: 'sk_' + Math.random().toString(36).substring(7) + '...',
            callback_url: 'https://api.merchant.com/callback',
            currency: 'CNY',
            allowed_ips: ['192.168.1.1'],
            state: true
        }
    }
})

const handleClose = () => {
    emit('update:show', false)
}

const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    message.success(t('common.copied'))
}

const handleRegenerate = () => {
    if (!window.confirm(t('merchantConfig.confirmRegenerate'))) return
    
    // Mock new key
    formModel.value.secret_key = 'sk_' + Math.random().toString(36).substring(7) + '...'
    message.success(t('merchantConfig.regenerateSuccess'))
}

const handleSave = async () => {
    loading.value = true
    try {
        // Mock API Save
        await new Promise(resolve => setTimeout(resolve, 800))
        message.success(t('merchantConfig.saveSuccess'))
        handleClose()
        emit('refresh')
    } catch (e) {
        message.error('Error saving configuration')
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <n-modal
        :show="show"
        @update:show="$emit('update:show', $event)"
        class="w-[700px]"
        preset="card"
        :title="`${t('merchantConfig.title')} (ID: ${merchantId})`"
        :bordered="false"
        size="huge"
        :mask-closable="false"
    >
        <n-tabs type="line" animated>
            <!-- Tab 1: Integration -->
            <n-tab-pane name="integration" :tab="t('merchantConfig.integration')">
                <n-form
                    label-placement="left"
                    label-width="140"
                    require-mark-placement="right-hanging"
                    class="mt-4"
                >
                    <n-form-item :label="t('merchantConfig.walletMode')">
                        <n-radio-group v-model:value="formModel.wallet_mode">
                            <n-radio-button value="transfer">{{ t('merchantConfig.transfer') }}</n-radio-button>
                            <n-radio-button value="seamless">{{ t('merchantConfig.seamless') }}</n-radio-button>
                        </n-radio-group>
                    </n-form-item>

                    <n-form-item :label="t('merchantConfig.apiKey')">
                        <n-input-group>
                            <n-input :value="formModel.api_key" readonly placeholder="Read Only" />
                            <n-button @click="handleCopy(formModel.api_key)">{{ t('common.copy') }}</n-button>
                        </n-input-group>
                    </n-form-item>

                    <n-form-item :label="t('merchantConfig.secretKey')">
                        <n-input-group>
                            <n-input :value="formModel.secret_key" readonly type="password" show-password-on="click" />
                            <n-button type="warning" ghost @click="handleRegenerate">
                                {{ t('merchantConfig.regenerate') }}
                            </n-button>
                        </n-input-group>
                    </n-form-item>

                    <n-form-item :label="t('merchantConfig.callbackUrl')">
                        <n-input v-model:value="formModel.callback_url" placeholder="https://..." />
                    </n-form-item>
                </n-form>
            </n-tab-pane>

            <!-- Tab 2: Security -->
            <n-tab-pane name="security" :tab="t('merchantConfig.security')">
                <n-form
                    label-placement="left"
                    label-width="140"
                    require-mark-placement="right-hanging"
                    class="mt-4"
                >
                    <n-form-item :label="t('merchant.currency')">
                        <n-select v-model:value="formModel.currency" :options="currencyOptions" />
                    </n-form-item>

                    <n-form-item :label="t('merchantConfig.allowedIps')">
                        <n-dynamic-tags v-model:value="formModel.allowed_ips" />
                        <template #feedback>
                            <span class="text-xs text-gray-500">{{ t('merchantConfig.enterIp') }}</span>
                        </template>
                    </n-form-item>

                    <n-form-item :label="t('common.status')">
                        <n-switch v-model:value="formModel.state">
                            <template #checked>{{ t('status.active') }}</template>
                            <template #unchecked>{{ t('status.disabled') }}</template>
                        </n-switch>
                    </n-form-item>
                </n-form>
            </n-tab-pane>
        </n-tabs>

        <!-- Footer -->
        <div class="flex justify-end gap-3 mt-6 border-t border-gray-700 pt-4">
            <n-button @click="handleClose" :disabled="loading">
                {{ t('common.cancel') }}
            </n-button>
            <n-button type="primary" @click="handleSave" :loading="loading">
                {{ t('common.save') }}
            </n-button>
        </div>
    </n-modal>
</template>
