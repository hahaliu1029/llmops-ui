import { defineStore } from 'pinia'
import { ref } from 'vue'

// 初始值
const initAccount = {
  name: 'typeofnull',
  email: '1@qq.com',
  avatar: '',
}

export const useAccountStore = defineStore('account', () => {
  const account = ref({ ...initAccount })

  const update = (data: unknown) => {
    Object.assign(account.value, data)
  }

  const clear = () => {
    account.value = { ...initAccount }
  }

  return {
    account,
    update,
    clear,
  }
})
