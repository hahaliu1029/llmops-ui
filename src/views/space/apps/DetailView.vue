<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import { ref } from 'vue'
import { debugApp } from '@/services/app'
import { useRoute } from 'vue-router'

interface Message {
  role: string
  content: string
}

const query = ref('')

const messages = ref<Message[]>([])
const isLoading = ref(false)

const route = useRoute()

const clearMessages = () => {
  messages.value = []
}

const sendMessage = async () => {
  if (!query.value) {
    Message.error('请输入内容')
    return
  }

  // 当上一条消息为加载状态时，不允许发送新消息
  if (messages.value.length && isLoading.value) {
    Message.error('请等待上一条消息加载完成')
    return
  }

  try {
    const humanQuery = query.value

    messages.value.push({
      role: 'human',
      content: humanQuery,
    })

    // 清空输入框
    query.value = ''

    isLoading.value = true

    // 发起请求
    // const response: { data: { content: string } } = await post(
    //   '/apps/44d376f7-fc3e-4372-b09f-0d9d8147eabc/debug',
    //   {
    //     body: { query: humanQuery },
    //   },
    // )

    // const content = response.data.content

    messages.value.push({
      role: 'ai',
      content: '',
    })

    const app_id = route.params.app_id

    await debugApp(app_id as string, humanQuery, (event_response) => {
      // 提取流式事件响应数据以及事件响应名称
      const event = event_response?.event
      const data = event_response?.data

      // 获取最后一条消息
      const lastIndex = messages.value.length - 1
      const message = messages.value[lastIndex]

      // TODO: 暂时只处理agent_message事件，其他事件类型等接口开发完毕后再处理
      if (event === 'agent_message') {
        const chunk_content = data?.data
        messages.value[lastIndex].content = message.content + chunk_content
      }
    })
  } finally {
    isLoading.value = false
  }

  isLoading.value = false
}
</script>

<template>
  <div class="min-h-screen">
    <header class="flex items-center h-[74px] bg-gray-100 border-b border-gray-200 px-4">
      顶部导航
    </header>
    <div class="flex flex-row h-[calc(100vh-74px)] overflow-hidden">
      <!--左侧编排-->
      <div class="w-2/3 bg-gray-50 h-full">
        <header class="flex items-center h-16 border-b border-gray-200 px-7 text-xl text-gray-700">
          <span>应用编排</span>
        </header>
        <div class="flex flex-row h-[calc(100%-64px)]">
          <div class="flex-1 border-r border-gray-200 p-6">人设与回复逻辑</div>
          <div class="flex-1 p-6">应用能力</div>
        </div>
      </div>
      <!--右侧调试与预览-->
      <div class="flex flex-col w-1/3 bg-white h-full">
        <header
          class="flex items-center h-16 border-b border-gray-200 px-4 text-xl bg-white shadow-sm"
        >
          <span>调试与预览</span>
        </header>
        <!--调试对话-->
        <div class="flex-1 px-6 py-7 overflow-x-hidden overflow-y-auto scrollbar min-h-0">
          <!--人类消息-->
          <!-- <div class="flex flex-row gap-2 mb-6">
            <a-avatar
              class="flex-shrink-0"
              :size="30"
              :style="{
                background: '#3370ff',
              }"
              >哈</a-avatar
            >
            <div class="flex flex-col gap-2">
              <div class="font-semibold text-gray-700">刘哈哈</div>
              <div
                class="bg-blue-700 text-white border boder-blue-800 px-4 py-3 rounded-2xl leading-5 max-w-max"
              >
                能详细介绍一下吗？
              </div>
            </div>
          </div> -->
          <!--机器人消息-->
          <!-- <div class="flex flex-row gap-2 mb-6">
            <a-avatar class="flex-shrink-0" :size="30" :style="{ backgroundColor: '#00d0b6' }">
              <icon-apps></icon-apps>
            </a-avatar>
            <div class="flex flex-col gap-2">
              <div class="font-semibold text-gray-700">GPT聊天机器人</div>
              <div
                class="bg-gray-100 text-gray-900 border boder-gray-200 px-4 py-3 rounded-2xl leading-5 max-w-max"
              >
                您好！我是由中国的深度求索（DeepSeek）公司开发的智能助手DeepSeek-V3。如您有任何任何问题，我会尽我所能为您提供帮助。
              </div>
            </div>
          </div> -->

          <div class="flex flex-row gap-2 mb-6" v-for="message in messages" :key="message.content">
            <a-avatar
              class="flex-shrink-0"
              :size="30"
              :style="{
                background: '#3370ff',
              }"
              v-if="message.role === 'human'"
              >哈</a-avatar
            >
            <a-avatar
              class="flex-shrink-0"
              :size="30"
              :style="{ backgroundColor: '#00d0b6' }"
              v-else
            >
              <icon-apps></icon-apps>
            </a-avatar>
            <div class="flex flex-col gap-2" v-if="message.role === 'human'">
              <div class="font-semibold text-gray-700">刘哈哈</div>
              <div
                class="bg-blue-700 text-white border boder-blue-800 px-4 py-3 rounded-2xl leading-5 max-w-max"
              >
                {{ message.content }}
              </div>
            </div>
            <div class="flex flex-col gap-2" v-else>
              <div class="font-semibold text-gray-700">GPT聊天机器人</div>
              <div
                class="bg-gray-100 text-gray-900 border boder-gray-200 px-4 py-3 rounded-2xl leading-5 max-w-max"
              >
                {{ message.content }}
                <div v-if="isLoading" class="cursor"></div>
              </div>
            </div>
          </div>
          <!--没有数据时-->
          <div
            class="mt-[200px] flex flex-col items-center justify-center gap-2"
            v-if="!messages.length"
          >
            <a-avatar :size="70" :style="{ backgroundColor: '#00d0b6' }" shape="square">
              <icon-apps></icon-apps>
            </a-avatar>
            <div class="text-2xl font-semibold text-gray-900">欢迎使用GPT聊天机器人</div>
          </div>
        </div>
        <!--输入框-->
        <div class="w-full flex-shrink-0 flex flex-col">
          <div class="px-6 flex items-center gap-4">
            <a-button class="flex-shrink-0" type="text" shape="circle" @click="clearMessages">
              <template #icon>
                <icon-empty size="16" :style="{ color: '#374151' }"></icon-empty>
              </template>
            </a-button>
            <div
              class="h-[50px] flex items-center gap-2 px-4 flex-1 border border-gray-200 rounded-full"
            >
              <input
                type="text"
                class="flex-1 outline-0"
                v-model="query"
                @keyup.enter="sendMessage"
              />
              <a-button type="text" shape="circle">
                <template #icon>
                  <icon-plus-circle size="16" :style="{ color: '#374151' }"></icon-plus-circle>
                </template>
              </a-button>
              <a-button type="text" shape="circle" @click="sendMessage">
                <template #icon>
                  <icon-send size="16" :style="{ color: '#1d4ed8' }"></icon-send>
                </template>
              </a-button>
            </div>
          </div>
          <div class="text-center text-gray-500 text-xs py-4">
            内容由AI生成，无法确保真实准确，仅供参考。
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cursor {
  display: inline-block;
  width: 1px;
  height: 14px;
  background-color: #444444;
  animation: blink 1s step-end infinite;
  vertical-align: middle;
}

@keyframes blink {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
</style>
