<script setup lang="ts">
import { onMounted, reactive, ref, computed } from 'vue'
import { getCategories, getBuiltinTools } from '@/services/builtin-tool'
import { API_PREFIX, TYPE_MAP } from '@/config'
import moment from 'moment'

const categories = reactive<Array<any>>([])
const providers = reactive<Array<any>>([])
const loading = ref(false)
const category = ref<string>('all')
const search_word = ref<string>('')
const showIndex = ref<number>(-1)

const filteredProviders = computed(() => {
  return providers.filter((item) => {
    // 分别检索分类信息和搜索关键字
    const categoryMatch = category.value === 'all' || item.category === category.value
    const searchMatch =
      search_word.value === '' || item.label.toLowerCase().includes(search_word.value.toLowerCase())
    return categoryMatch && searchMatch
  })
})

onMounted(async () => {
  const resp = await getCategories()
  categories.push(...resp.data)
})

onMounted(async () => {
  try {
    loading.value = true
    const resp = await getBuiltinTools()
    providers.push(...resp.data)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <a-spin :loading="loading" class="block h-full w-full">
    <div class="p-6 flex flex-col">
      <!--顶层标题+创建按钮-->
      <div class="flex items-center justify-between mb-6">
        <!--左侧标题-->
        <div class="flex items-center gap-2">
          <a-avatar :size="32" class="bg-blue-700">
            <icon-common :size="18"></icon-common>
          </a-avatar>
          <div class="text-lg font-medium text-gray-900">插件广场</div>
        </div>
        <a-button type="primary" class="rounded-lg"> 创建自定义插件 </a-button>
      </div>
      <!--插件分类+搜索框-->
      <div class="flex items-center justify-between mb-6">
        <!--左侧分类-->
        <div class="flex items-center gap-2">
          <a-button
            :type="category === 'all' ? 'secondary' : 'text'"
            class="rounded-lg !text-gray-700 px-3"
            @click="category = 'all'"
            >全部</a-button
          >
          <a-button
            v-for="item in categories"
            :key="item.id"
            :type="category === item.category ? 'secondary' : 'text'"
            class="rounded-lg !text-gray-700 px-3"
            @click="category = item.category"
          >
            {{ item.name }}
          </a-button>
        </div>
        <!--右侧搜索框-->
        <a-input-search
          v-model="search_word"
          placeholder="请输入插件名称"
          class="w-[240px] bg-white rounded-lg border-gray-300"
        />
      </div>
      <!--插件列表-->
      <a-row :gutter="[20, 20]" class="flex-1">
        <!--有数据-->
        <a-col v-for="(provider, index) in filteredProviders" :key="provider.name" :span="6">
          <a-card hoverable class="rounded-lg cursor-pointer" @click="showIndex = index">
            <!--顶部提供商名称-->
            <div class="flex items-center gap-3 mb-3">
              <!--左侧图标-->
              <a-avatar :size="40" shape="square" :style="{ backgroundColor: provider.background }">
                <img
                  :src="`${API_PREFIX}/builtin-tools/${provider.name}/icon`"
                  :alt="provider.name"
                />
              </a-avatar>
              <!--右侧-->
              <div class="flex flex-col">
                <div class="text-base text-gray-900 font-bold">{{ provider.label }}</div>
                <div class="text-xs text-gray-500 line-clamp-1">
                  提供商 {{ provider.name }} · {{ provider.tools.length }} 个插件
                </div>
              </div>
            </div>
            <div class="leading-[18px] text-gray-500 h-[72px] line-clamp-4 mb-2">
              {{ provider.description }}
            </div>
            <!--提供商发布信息-->
            <div class="flex items-center gap-1.5">
              <a-avatar :size="18" class="bg-blue-700">
                <icon-user></icon-user>
              </a-avatar>
              <div class="text-xs text-gray-400">
                111·发布时间 {{ moment(provider.created_at).format('MM-DD HH:mm') }}
              </div>
            </div>
          </a-card>
        </a-col>
        <!--没有数据-->
        <a-col v-if="filteredProviders.length === 0" :span="24">
          <a-empty
            description="没有可用内置插件"
            class="h-[400px] flex flex-col items-center justify-center"
          ></a-empty>
        </a-col>
      </a-row>
      <!--卡片抽屉-->
      <a-drawer
        :visible="showIndex !== -1"
        title="工具详情"
        :width="350"
        :footer="false"
        :drawer-style="{ background: '#f9fafb' }"
        @cancel="showIndex = -1"
      >
        <div v-if="showIndex !== -1">
          <!--顶部提供商名称-->
          <div class="flex items-center gap-3 mb-3">
            <!--左侧图标-->
            <a-avatar
              :size="40"
              shape="square"
              :style="{ backgroundColor: filteredProviders[showIndex].background }"
            >
              <img
                :src="`${API_PREFIX}/builtin-tools/${filteredProviders[showIndex].name}/icon`"
                :alt="filteredProviders[showIndex].name"
              />
            </a-avatar>
            <!--右侧-->
            <div class="flex flex-col">
              <div class="text-base text-gray-900 font-bold">
                {{ filteredProviders[showIndex].label }}
              </div>
              <div class="text-xs text-gray-500 line-clamp-1">
                提供商 {{ filteredProviders[showIndex].name }} ·
                {{ filteredProviders[showIndex].tools.length }} 个插件
              </div>
            </div>
          </div>
          <div class="leading-[18px] text-gray-500 mb-2">
            {{ filteredProviders[showIndex].description }}
          </div>
          <!--分隔符-->
          <hr class="my-4" />
          <!--提供者工具-->
          <div class="flex flex-col gap-2">
            <div class="text-xs text-gray-500">
              包含{{ filteredProviders[showIndex].tools.length }}个工具
            </div>
            <!--工具列表-->
            <a-card
              v-for="tool in filteredProviders[showIndex].tools"
              :key="tool.name"
              class="coursor-pointer flex flex-col rounded-xl"
            >
              <!--工具名称-->
              <div class="font-bold text-gray-900 mb-2">{{ tool.label }}</div>
              <!--工具描述-->
              <div class="text-gray-500 text-xs">
                {{ tool.description }}
              </div>
              <!--工具参数-->
              <div v-if="tool.inputs.length > 0" class="">
                <!--分隔符-->
                <div class="flex items-center gap-2 my-4">
                  <div class="text-xs font-bold text-gray-500">参数</div>
                  <hr class="flex-1" />
                </div>
                <!--参数列表-->
                <div class="flex flex-col gap-4">
                  <div v-for="input in tool.inputs" :key="input.name" class="flex flex-col gap-2">
                    <!--上半部分---->
                    <div class="flex items-center gap-2 text-xs">
                      <div class="text-gray-900 font-bold">
                        {{ input.name }}
                      </div>
                      <div class="text-gray-500">
                        {{ TYPE_MAP[input.type as keyof typeof TYPE_MAP] }}
                      </div>
                      <div v-if="input.required" class="text-red-700">必填</div>
                    </div>
                    <!--参数描述信息-->
                    <div class="text-xs text-gray-500">
                      {{ input.description }}
                    </div>
                  </div>
                </div>
              </div>
            </a-card>
          </div>
        </div>
      </a-drawer>
    </div>
  </a-spin>
</template>

<style scoped></style>
