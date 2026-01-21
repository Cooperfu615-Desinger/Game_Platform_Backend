<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { NButton, NDataTable, NDrawer, NForm, NFormItem, NInput, useMessage } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import type { DataTableColumns } from 'naive-ui'
import type { JobLevel } from '../../../types/system'

const { t } = useI18n()
const message = useMessage()

const loading = ref(false)
const jobLevels = ref<JobLevel[]>([])
const showDrawer = ref(false)
const isEdit = ref(false)

const formModel = ref({
    id: 0,
    name: '',
    description: '',
    permissions: [] as string[]
})

const columns: DataTableColumns<JobLevel> = [
    { title: 'ID', key: 'id', width: 80 },
    { title: t('system.jobName'), key: 'name', width: 200 },
    { title: t('system.description'), key: 'description', ellipsis: { tooltip: true } },
    { 
        title: t('system.memberCount'), 
        key: 'member_count', 
        width: 120,
        render: (row) => row.member_count || 0
    },
    {
        title: t('common.action'),
        key: 'actions',
        width: 180,
        render: (row) => {
            return [
                h(NButton, { 
                    size: 'small', 
                    onClick: () => handleEdit(row),
                    style: { marginRight: '8px' }
                }, { default: () => t('common.edit') }),
                h(NButton, { 
                    size: 'small', 
                    type: 'error',
                    onClick: () => handleDelete(row.id)
                }, { default: () => t('common.delete') })
            ]
        }
    }
]

async function fetchJobLevels() {
    loading.value = true
    try {
        const res = await fetch('/api/admin/job-levels')
        const data = await res.json()
        jobLevels.value = data.data.list || []
    } catch (error) {
        message.error('Failed to load job levels')
    } finally {
        loading.value = false
    }
}

function handleCreate() {
    isEdit.value = false
    formModel.value = { id: 0, name: '', description: '', permissions: [] }
    showDrawer.value = true
}

function handleEdit(row: JobLevel) {
    isEdit.value = true
    formModel.value = {
        id: row.id,
        name: row.name,
        description: row.description,
        permissions: row.permissions || []
    }
    showDrawer.value = true
}

async function handleSave() {
    loading.value = true
    try {
        const method = isEdit.value ? 'PUT' : 'POST'
        const url = isEdit.value ? `/api/admin/job-levels/${formModel.value.id}` : '/api/admin/job-levels'
        
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formModel.value)
        })
        
        if (!res.ok) {
            const errorData = await res.json()
            throw new Error(errorData.msg || 'Failed to save')
        }
        
        message.success(isEdit.value ? 'Job Level updated successfully' : 'Job Level created successfully')
        showDrawer.value = false
        await fetchJobLevels()
    } catch (error: any) {
        message.error(error.message || 'Failed to save')
    } finally {
        loading.value = false
    }
}

async function handleDelete(id: number) {
    if (!confirm(t('system.deleteJobLevelConfirm'))) return
    
    loading.value = true
    try {
        const res = await fetch(`/api/admin/job-levels/${id}`, { method: 'DELETE' })
        const data = await res.json()
        
        if (!res.ok) {
            throw new Error(data.msg || 'Failed to delete')
        }
        
        message.success('Job Level deleted successfully')
        await fetchJobLevels()
    } catch (error: any) {
        message.error(error.message || 'Failed to delete')
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    fetchJobLevels()
})
</script>

<template>
    <div class="p-6">
        <div class="flex justify-between items-center mb-4">
            <h1 class="text-2xl font-bold">{{ t('system.jobLevels') }}</h1>
            <n-button type="primary" @click="handleCreate">
                {{ t('system.createJobLevel') }}
            </n-button>
        </div>

        <n-data-table
            :columns="columns"
            :data="jobLevels"
            :loading="loading"
            :pagination="{ pageSize: 20 }"
        />

        <n-drawer v-model:show="showDrawer" :width="500">
            <div class="p-6">
                <h2 class="text-xl font-bold mb-4">
                    {{ isEdit ? t('system.editJobLevel') : t('system.createJobLevel') }}
                </h2>
                
                <n-form :model="formModel">
                    <n-form-item :label="t('system.jobName')" required>
                        <n-input v-model:value="formModel.name" />
                    </n-form-item>
                    
                    <n-form-item :label="t('system.description')">
                        <n-input 
                            v-model:value="formModel.description"
                            type="textarea"
                            :rows="3"
                        />
                    </n-form-item>
                    
                    <div class="text-sm text-gray-400">
                        {{ t('system.permissions') }}: {{ formModel.permissions.length }} selected
                        <br>(Permission tree UI: TBD in next iteration)
                    </div>
                </n-form>

                <div class="flex justify-end gap-3 mt-6">
                    <n-button @click="showDrawer = false">{{ t('common.cancel') }}</n-button>
                    <n-button type="primary" @click="handleSave" :loading="loading">
                        {{ t('common.save') }}
                    </n-button>
                </div>
            </div>
        </n-drawer>
    </div>
</template>
