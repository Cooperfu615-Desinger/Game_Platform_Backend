<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { 
  NLayout, NLayoutSider, NLayoutHeader, NLayoutContent, NLayoutFooter,
  NMenu, NButton, NAvatar, NDropdown, NTag, NConfigProvider, NDrawer, NDrawerContent
} from 'naive-ui'
import type { MenuOption, GlobalThemeOverrides } from 'naive-ui'
import { NIcon } from 'naive-ui'
import { useAuthStore } from '../stores/auth'
import { useBreakpoints, breakpointsTailwind } from '@vueuse/core'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
import { useI18n } from 'vue-i18n'
import { merchantMenuOptions } from '../config/menu-merchant'

const router = useRouter()
const currentRoute = useRoute()
const authStore = useAuthStore()
const { t } = useI18n()

// State
const collapsed = ref(false)
const showMobileMenu = ref(false)

// Mobile Detection
const breakpoints = useBreakpoints(breakpointsTailwind)
const isMobile = breakpoints.smaller('md')
const isDesktop = breakpoints.greaterOrEqual('md')

// Menu Options from config
const menuOptions = computed<MenuOption[]>(() => merchantMenuOptions(t))

// Active Key Logic
const activeKey = computed(() => currentRoute.name as string)

// Header Dropdown
const userOptions = computed(() => [
    { label: t('menu.profile'), key: 'profile' },
    { label: t('menu.logout'), key: 'logout' }
])
const handleUserSelect = (key: string) => {
    if (key === 'logout') {
        authStore.logout()
        router.push('/login')
    }
}

const handleVersionClick = () => {
    window.alert('Merchant Portal v0.1.0')
}

// Light Theme Overrides for Merchant Layout
const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#2563eb',
    primaryColorHover: '#1d4ed8'
  },
  Layout: {
    siderColor: '#f8fafc',
    siderBorderColor: '#e2e8f0',
    headerColor: '#ffffff',
    headerBorderColor: '#e2e8f0'
  },
  Menu: {
    itemTextColor: '#334155',
    itemIconColor: '#64748b',
    itemTextColorHover: '#2563eb',
    itemIconColorHover: '#2563eb',
    itemTextColorActive: '#2563eb',
    itemIconColorActive: '#2563eb',
    itemColorActive: '#eff6ff',
    itemColorActiveHover: '#dbeafe',
    groupTextColor: '#94a3b8'
  }
}
</script>

<template>
  <n-config-provider :theme-overrides="themeOverrides">
    <n-layout has-sider class="h-screen">
      <!-- Light Theme Sider for Merchant Portal -->
      <n-layout-sider
        v-if="isDesktop"
        bordered
        collapse-mode="width"
        :collapsed-width="64"
        :width="240"
        :collapsed="collapsed"
        show-trigger="bar"
        @collapse="collapsed = true"
        @expand="collapsed = false"
      >
          <div class="h-16 flex items-center justify-center overflow-hidden whitespace-nowrap border-b border-slate-200 bg-white">
             <span v-if="!collapsed" class="text-xl font-bold text-slate-800 tracking-widest pl-4">
               💼 Merchant
             </span>
             <span v-else class="text-xl font-bold text-slate-800">💼</span>
          </div>
        <n-menu
          :collapsed="collapsed"
          :collapsed-width="64"
          :collapsed-icon-size="22"
          :options="menuOptions"
          :value="activeKey"
        />
      </n-layout-sider>

      <!-- Mobile Drawer -->
      <n-drawer v-model:show="showMobileMenu" :width="240" placement="left">
          <n-drawer-content body-content-style="padding: 0;">
              <div class="h-16 flex items-center justify-center border-b border-slate-200 bg-white">
                  <span class="text-xl font-bold text-slate-800 tracking-widest">💼 Merchant</span>
              </div>
              <n-menu
                  :options="menuOptions"
                  :value="activeKey"
                  @update:value="showMobileMenu = false"
              />
          </n-drawer-content>
      </n-drawer>

      <n-layout>
        <n-layout-header bordered class="h-16 flex items-center justify-between px-6 bg-white">
           <div class="flex items-center">
              <n-button quaternary circle @click="isMobile ? showMobileMenu = true : collapsed = !collapsed">
                  <template #icon>
                      <n-icon size="24" color="#64748b">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                          </svg>
                      </n-icon>
                  </template>
              </n-button>
              <n-tag type="info" size="small" class="ml-4">MERCHANT</n-tag>
           </div>
           
           <div class="flex items-center gap-4">
               <div class="text-right hidden md:block">
                   <div class="text-sm font-bold text-slate-800">商戶管理員</div>
                   <div class="text-xs text-slate-500">Merchant Operator</div>
               </div>
               <LanguageSwitcher />
               <n-dropdown :options="userOptions" @select="handleUserSelect">
                  <n-avatar round size="medium" src="https://ui-avatars.com/api/?name=Merchant&background=2563eb&color=fff" class="cursor-pointer" />
               </n-dropdown>
           </div>
        </n-layout-header>
        
        <n-layout-content content-style="padding: 24px; min-height: 85vh; background: #f8fafc;">
           <router-view v-slot="{ Component }">
              <transition name="fade" mode="out-in">
                <component :is="Component" />
              </transition>
           </router-view>
        </n-layout-content>
        <n-layout-footer bordered class="p-4 text-center bg-white">
            <n-tag :bordered="false" size="small" class="cursor-pointer opacity-50 hover:opacity-100 transition-opacity" @click="handleVersionClick">
               Version: v0.1.0 (Merchant Portal)
            </n-tag>
        </n-layout-footer>
      </n-layout>
    </n-layout>
  </n-config-provider>
</template>
