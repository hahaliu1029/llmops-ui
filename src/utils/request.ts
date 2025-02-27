import { API_PREFIX, HTTP_CODE } from '@/config'
import { Message } from '@arco-design/web-vue'

const TIME_OUT = 100000 // 请求超时时间 100s

// 基础配置
const baseConfig = {
  method: 'GET',
  // mode: 'cors', // 跨域请求模式
  credentials: 'include', // 请求带上cookie
  headers: new Headers({
    'Content-Type': 'application/json',
  }), // 请求头
  redirect: 'follow', // 重定向模式
}

// fetch参数类型
type FetchOptionType = Omit<RequestInit, 'body'> & {
  body?: BodyInit | Record<string, unknown> | null
  params?: Record<string, string | number | boolean>
}

// 封装fetch请求
export const baseFetch = <T>(url: string, fetchOptions: FetchOptionType): Promise<T> => {
  // 将所有配置信息合并
  const options: typeof baseConfig & FetchOptionType = Object.assign({}, baseConfig, fetchOptions) // 合并配置

  // 请求地址
  let requestUrl = `${API_PREFIX}${url.startsWith('/') ? url : `/${url}`}`

  // 解构出请求参数
  const { method, params, body } = options

  if (method === 'GET' && params) {
    const paramsArray: string[] = []
    Object.keys(params).forEach((key: string) => {
      paramsArray.push(`${key}=${encodeURIComponent(params[key])}`)
    })
    if (requestUrl.search(/\?/) === -1) {
      requestUrl += `?${paramsArray.join('&')}`
    } else {
      requestUrl += `&${paramsArray.join('&')}`
    }

    delete options.params
  }

  if (body) {
    console.log(body)
    options.body = JSON.stringify(body)
  }

  return Promise.race([
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('请求超时'))
      }, TIME_OUT)
    }),
    new Promise((resolve, reject) => {
      globalThis
        .fetch(requestUrl, options as RequestInit)
        .then(async (res) => {
          // resolve(res.json())
          const data = await res.json()
          if (res.ok) {
            if (data.code === HTTP_CODE.SUCCESS) {
              resolve(data)
            } else {
              Message.error(data.message)
              reject(new Error(data.message))
            }
          } else {
            Message.error(data.message)
            reject(new Error(data.message))
          }
        })
        .catch((error) => {
          Message.error('请求失败')
          reject(error)
        })
    }),
  ]) as Promise<T>
}

// 封装基于post的sse（流式事件响应）请求
export const ssePost = async (
  url: string,
  fetchOptions: FetchOptionType,
  onData: (data: { [key: string]: any }) => void,
) => {
  // 组装基础fetch请求配置
  const options = Object.assign({}, baseConfig, { method: 'POST' }, fetchOptions)

  // 请求地址
  const requestUrl = `${API_PREFIX}${url.startsWith('/') ? url : `/${url}`}`

  // 解构body参数并处理body数据
  const { body } = fetchOptions
  if (body) {
    options.body = JSON.stringify(body)
  }

  // 发起请求并处理响应
  const response = await globalThis.fetch(requestUrl, options as RequestInit)
  return handleStream(response, onData)
  // globalThis.fetch(requestUrl, options as RequestInit).then((res) => {
  //   return handleStream(res, onData)
  // })
}

const handleStream = (res: Response, onData: (data: { [key: string]: any }) => void) => {
  // 检测网络请求是否成功
  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`)
  }

  // 构建reader和decoder
  const reader = res.body?.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  // 构建read函数用于读取数据
  const read = () => {
    let hasError = false
    reader?.read().then((result: any) => {
      if (result.done) {
        return
      }

      buffer += decoder.decode(result.value, { stream: true })
      const lines = buffer.split('\n')

      let event = ''
      let data = ''

      try {
        lines.forEach((line) => {
          line = line.trim()
          if (line.startsWith('event:')) {
            event = line.slice(6).trim()
          } else if (line.startsWith('data:')) {
            data = line.slice(5).trim()
          }
          // 每个事件以空行结束，只有event和data同时存在，才表示一次流式事件的数据完整获取到了
          if (line === '') {
            if (event !== '' && data !== '') {
              onData({ event: event, data: JSON.parse(data) })
            }

            event = ''
            data = ''
          }
        })
        buffer = lines.pop() || ''
      } catch (e) {
        console.error(e)
        hasError = true
      }

      if (!hasError) {
        read()
      }
    })
  }

  read()
}

export const request = <T>(url: string, options: FetchOptionType = {}) => {
  return baseFetch<T>(url, options)
}

// 封装get请求
export const get = <T>(url: string, options = {}) => {
  return request<T>(url, { ...options, method: 'GET' })
}

// 封装post请求
export const post = <T>(url: string, options = {}) => {
  return request<T>(url, { ...options, method: 'POST' })
}
