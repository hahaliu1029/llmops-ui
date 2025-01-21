<script setup lang="ts">
import { useAccountStore } from '@/stores/account'

const accountStore = useAccountStore()

const updateName = () => {
  accountStore.update({
    name: 'new name',
  })
}
</script>

<template>
  <p>首页</p>
  <p>当前用户：{{ accountStore.account.name }}</p>
  <p>当前用户邮箱：{{ accountStore.account.email }}</p>
  <a-button type="primary" @click="updateName">修改用户名</a-button>
  <a-button type="primary" @click="accountStore.clear">重置</a-button>
</template>
