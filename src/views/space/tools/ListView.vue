<script setup lang="ts">
import { onMounted, reactive, ref, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  getApiToolProvidersWithPage,
  validateOpenApiSchema,
  getApiToolProvider,
  createApiToolProvider,
  updateApiToolProvider,
  deleteApiToolProvider,
} from '@/services/api-tool'
import moment from 'moment'
import { TYPE_MAP } from '@/config'
import { Message, Modal } from '@arco-design/web-vue'

const route = useRoute()
const props = defineProps({
  createType: {
    type: String,
    required: true,
  },
}) // 从父组件传递的参数
const emits = defineEmits(['updateCreateType']) // 向父组件发送事件
const providers = reactive<Array<any>>([])
const showIndex = ref<number>(-1)
const showUpdateModalLoading = ref<boolean>(false)
const submitLoading = ref<boolean>(false)
const paginator = reactive({
  current_page: 1,
  page_size: 20,
  total_page: 0,
  total_record: 0,
})
const loading = ref<boolean>(false)
const showUpdateModel = ref<boolean>(false)
interface Header {
  key: string
  value: string
}

interface FormValues {
  icon: string
  name: string
  openapi_schema: string
  headers: Header[]
}

const form = reactive({
  icon: 'https://picsum.photos/400',
  name: '',
  openapi_schema: '',
  headers: [] as Header[],
})
const formRef = ref<any>(null)

const tools = computed(() => {
  try {
    // 解析OpenAPI Schema
    const schema = JSON.parse(form.openapi_schema)
    const available_tools = []

    // 检测是否存在paths
    if (schema.paths) {
      // 遍历paths
      for (const path in schema.paths) {
        // 遍历methods
        for (const method in schema.paths[path]) {
          if (['get', 'post'].includes(method.toLowerCase())) {
            // 提取工具信息，并校验是否存在name, description
            const tool = schema.paths[path][method]
            if ('operationId' in tool && 'description' in tool) {
              available_tools.push({
                name: tool?.operationId,
                description: tool?.description,
                method: method.toUpperCase(),
                path: path,
              })
            }
          }
        }
      }
    }
    return available_tools
  } catch (e) {
    console.error(e)
  }
  return []
})

const loadMoreData = async (init: boolean = false) => {
  // 检测是否需要加载数据
  if (!init && paginator.current_page > paginator.total_page) {
    return
  }

  // 加载更多数据并更新数据状态
  try {
    loading.value = true
    const res = await getApiToolProvidersWithPage(
      paginator.current_page,
      paginator.page_size,
      route.query?.search as string | '',
    )
    const data = res.data

    // 更新分页器
    paginator.current_page = data.paginator.current_page
    paginator.total_page = data.paginator.total_page
    paginator.total_record = data.paginator.total_record
    paginator.page_size = data.paginator.page_size

    // 判断是否存在更多数据
    // console.log(paginator.current_page, paginator.total_page)
    if (paginator.current_page <= paginator.total_page) {
      paginator.current_page += 1
    }

    // 追加或者更新数据
    if (init) {
      providers.splice(0, providers.length, ...data.list)
    } else {
      providers.push(...data.list)
    }
  } finally {
    loading.value = false
  }
}

const initData = async () => {
  paginator.current_page = 1
  paginator.total_page = 0
  paginator.total_record = 0
  paginator.page_size = 20
  await loadMoreData(true)
}

const handleScroll = (e: Event) => {
  const { scrollTop, clientHeight, scrollHeight } = e.target as HTMLElement
  if (scrollTop + clientHeight >= scrollHeight) {
    loadMoreData()
  }
}

const handleSubmit = async ({ values, errors }: { values: FormValues; errors: any }) => {
  if (errors) {
    return
  }

  try {
    submitLoading.value = true
    if (props.createType === 'tool') {
      const res = await createApiToolProvider(values)
      Message.success(res.message)
    } else if (showUpdateModel.value) {
      const provider_id = providers[showIndex.value].id
      const res = await updateApiToolProvider(provider_id, values)
      Message.success(res.message)
    }

    // 隐藏模态窗，隐藏抽屉
    handleCancel()
    showIndex.value = -1
  } catch (e) {
    console.error(e)
  } finally {
    submitLoading.value = false
  }

  // 重新加载数据
  await initData()
}

const handleCancel = () => {
  formRef.value.resetFields()
  form.headers = []
  emits('updateCreateType', '')
  showUpdateModel.value = false
}

const handleUpdate = async () => {
  try {
    // 获取当前provider_id
    showUpdateModalLoading.value = true
    const provider_id = providers[showIndex.value].id

    // 根据拿到的id获取详情信息
    const res = await getApiToolProvider(provider_id)
    const data = res.data

    // 重置表单
    formRef.value.resetFields()

    // 更新表单数据
    form.icon = data.icon
    form.name = data.name
    form.openapi_schema = data.openapi_schema
    form.headers = data.headers
  } catch (e) {
    console.error(e)
  } finally {
    showUpdateModalLoading.value = false
  }
  showUpdateModel.value = true
}

const handleDelete = () => {
  //二次确认
  Modal.confirm({
    title: '删除工具',
    content: '确定删除该工具？',
    onOk: async () => {
      try {
        const provider_id = providers[showIndex.value].id
        const res = await deleteApiToolProvider(provider_id)
        Message.success(res.message)
      } catch (e) {
        console.error(e)
      } finally {
        handleCancel()
        showIndex.value = -1
        await initData()
      }
    },
  })
}

const handleValidate = async () => {
  if (form.openapi_schema.trim() !== '') {
    try {
      await validateOpenApiSchema(form.openapi_schema)
    } catch (e) {
      console.error(e)
    }
  }
}

onMounted(async () => {
  await loadMoreData(true)
})

watch(
  () => route.query.search,
  async () => {
    await initData()
  },
)
</script>

<template>
  <a-spin
    :loading="loading"
    class="w-full h-full block overflow-scroll scrollbar-w-none"
    @scroll="handleScroll"
  >
    <a-row :gutter="[20, 20]" class="flex-1">
      <!--有数据-->
      <a-col v-for="(provider, index) in providers" :key="provider.name" :span="6">
        <a-card hoverable class="rounded-lg cursor-pointer" @click="showIndex = index">
          <!--顶部提供商名称-->
          <div class="flex items-center gap-3 mb-3">
            <!--左侧图标-->
            <a-avatar :size="40" shape="square" :image-url="provider.icon"> </a-avatar>
            <!--右侧-->
            <div class="flex flex-col">
              <div class="text-base text-gray-900 font-bold">{{ provider.name }}</div>
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
              自定义·编辑时间 {{ moment(provider.created_at).format('MM-DD HH:mm') }}
            </div>
          </div>
        </a-card>
      </a-col>
      <!--没有数据-->
      <a-col v-if="providers.length === 0" :span="24">
        <a-empty
          description="没有可用API插件"
          class="h-[400px] flex flex-col items-center justify-center"
        ></a-empty>
      </a-col>
    </a-row>
    <!--加载器-->
    <a-row v-if="providers.length > 0">
      <!--加载数据中-->
      <a-col v-if="paginator.current_page <= paginator.total_page" :span="24">
        <a-space class="my-4 flex justify-center">
          <a-spin></a-spin>
          <div class="text-gray-400">加载中</div>
        </a-space>
      </a-col>
      <!--数据加载完成-->
      <a-col v-else :span="24">
        <div class="text-gray-400 my-4 flex justify-center">数据加载完成</div>
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
          <a-avatar :size="40" shape="square" :image-url="providers[showIndex].icon"> </a-avatar>
          <!--右侧-->
          <div class="flex flex-col">
            <div class="text-base text-gray-900 font-bold">
              {{ providers[showIndex].name }}
            </div>
            <div class="text-xs text-gray-500 line-clamp-1">
              提供商 {{ providers[showIndex].name }} ·
              {{ providers[showIndex].tools.length }} 个插件
            </div>
          </div>
        </div>
        <div class="leading-[18px] text-gray-500 mb-2">
          {{ providers[showIndex].description }}
        </div>
        <!--编辑按钮-->
        <a-button
          type="dashed"
          long
          class="rounded-lg mb-2"
          @click="handleUpdate"
          :loading="showUpdateModalLoading"
        >
          <template #icon>
            <icon-edit></icon-edit>
          </template>
          编辑工具
        </a-button>
        <!--分隔符-->
        <hr class="my-4" />
        <!--提供者工具-->
        <div class="flex flex-col gap-2">
          <div class="text-xs text-gray-500">包含{{ providers[showIndex].tools.length }}个工具</div>
          <!--工具列表-->
          <a-card
            v-for="tool in providers[showIndex].tools"
            :key="tool.name"
            class="coursor-pointer flex flex-col rounded-xl"
          >
            <!--工具名称-->
            <div class="font-bold text-gray-900 mb-2">{{ tool.name }}</div>
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
    <!--新建/修改模态窗-->
    <a-modal
      :width="630"
      :visible="props.createType === 'tool' || showUpdateModel"
      hide-title
      :footer="false"
      modal-class="rounded-xl"
      @cancel="handleCancel"
    >
      <!--顶部标题-->
      <div class="flex items-center justify-between">
        <div class="text-lg font-bold text-gray-700">
          {{ showUpdateModel ? '编辑' : '新建' }}插件
        </div>
        <a-button type="text" class="rounded-lg !text-gray-700" size="small" @click="handleCancel">
          <template #icon>
            <icon-close></icon-close>
          </template>
        </a-button>
      </div>
      <!--表单-->
      <div class="pt-6">
        <a-form layout="vertical" :model="form" ref="formRef" @submit="handleSubmit">
          <a-form-item
            field="icon"
            hide-label
            :rules="[{ required: true, message: '插件图标不能为空' }]"
          >
            <a-upload
              :limit="1"
              list-type="picture-card"
              accept="image/*"
              class="!w-auto mx-auto"
              v-model="form.icon"
            >
            </a-upload>
          </a-form-item>
          <a-form-item
            field="name"
            label="插件名称"
            asterisk-position="end"
            :rules="[{ required: true, message: '插件名称不能为空' }]"
          >
            <a-input
              placeholder="请输入插件名称"
              show-word-limit
              :max-length="60"
              v-model="form.name"
            >
            </a-input>
          </a-form-item>
          <a-form-item
            field="openapi_schema"
            label="OpenAPI Schema"
            asterisk-position="end"
            :rules="[{ required: true, message: 'OpenAPI Schema不能为空' }]"
          >
            <a-textarea
              :auto-size="{ minRows: 4, maxRows: 6 }"
              placeholder="请输入OpenAPI Schema"
              v-model="form.openapi_schema"
              @blur="handleValidate"
            ></a-textarea>
          </a-form-item>
          <a-form-item label="可用工具">
            <!--可用工具表格-->
            <div class="rounded-lg border border-gray-200 w-full overflow-x-auto">
              <table class="w-full leading-[18px] text-gray-700 text-xs font-normal">
                <thead class="text-gray-500">
                  <tr class="border-b border-gray-200">
                    <th class="p-2 pl-3 font-medium">名称</th>
                    <th class="p-2 pl-3 font-medium w-[236px]">描述</th>
                    <th class="p-2 pl-3 font-medium">方法</th>
                    <th class="p-2 pl-3 font-medium">路径</th>
                  </tr>
                </thead>
                <tbody class="border-b border-gray-200">
                  <tr
                    class="border-b border-gray-200 last:border-0 text-gray-700"
                    v-for="(tool, index) in tools"
                    :key="index"
                  >
                    <td class="p-2 pl-3">
                      {{ tool.name }}
                    </td>
                    <td class="p-2 pl-3 w-[236px]">
                      {{ tool.description }}
                    </td>
                    <td class="p-2 pl-3">
                      {{ tool.method }}
                    </td>
                    <td class="p-2 pl-3 w-[62px]">
                      {{ tool.path }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </a-form-item>
          <a-form-item label="Headers">
            <!--请求头表单-->
            <div class="roundes-lg border border-gray-200 w-full overflow-x-auto">
              <table class="w-full leading-[18px] text-gray-700 text-xs font-normal mb-3">
                <thead class="text-gray-500">
                  <tr class="border-b border-gray-200">
                    <th class="p-2 pl-3 font-medium">Key</th>
                    <th class="p-2 pl-3 font-medium">Value</th>
                    <th class="p-2 pl-3 font-medium w-[50px]">操作</th>
                  </tr>
                </thead>
                <tbody class="border-b border-gray-200" v-if="form.headers.length > 0">
                  <tr
                    class="border-b border-gray-200 last:border-0 text-gray-700"
                    v-for="(header, index) in form.headers"
                    :key="index"
                  >
                    <td class="p-2 pl-3">
                      <a-form-item hide-label class="m-0" :field="`headers[${index}].key`">
                        <a-input placeholder="请输入Key" v-model="header.key"> </a-input>
                      </a-form-item>
                    </td>
                    <td class="p-2 pl-3">
                      <a-form-item hide-label class="m-0" :field="`headers[${index}].value`">
                        <a-input placeholder="请输入Value" v-model="header.value"> </a-input>
                      </a-form-item>
                    </td>
                    <td class="p-2 pl-3 w-[50px]">
                      <a-button
                        type="text"
                        class="!text-gray-700"
                        size="mini"
                        @click="form.headers.splice(index, 1)"
                      >
                        <template #icon>
                          <icon-delete></icon-delete>
                        </template>
                      </a-button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <a-button
                class="rounded ml-3 mb-3 !text-gray-700"
                size="mini"
                @click="
                  form.headers.push({
                    key: '',
                    value: '',
                  })
                "
              >
                <template #icon>
                  <icon-plus></icon-plus>
                </template>
                添加Header
              </a-button>
            </div>
          </a-form-item>
          <!--底部按钮-->
          <div class="flex item-center justify-between">
            <div class="">
              <a-button
                class="rounded-lg !text-red-700"
                @click="handleDelete"
                v-if="showUpdateModel"
              >
                删除
              </a-button>
            </div>
            <a-space :size="16">
              <a-button class="rounded-lg !text-gray-700" @click="handleCancel">取消</a-button>
              <a-button type="primary" class="rounded-lg" html-type="submit">保存</a-button>
            </a-space>
          </div>
        </a-form>
      </div>
    </a-modal>
  </a-spin>
</template>

<style scoped></style>
