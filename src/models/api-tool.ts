import { type BasePaginatorResponse } from './base'

// 获取自定义API插件响应接口
export type GetApiToolProvidersWithPageResponse = BasePaginatorResponse<{
  id: string
  name: string
  description: string
  icon: string
  headers: Array<any>
  tools: Array<any>
  created_at: number
}>

// 新增自定义API插件提供者请求接口
export type CreateApiToolProviderRequest = {
  name: string
  icon: string
  headers: Array<any>
  openapi_schema: string
}

// 更新自定义API工具提供者请求与响应接口
export type UpdateApiToolProviderRequest = {
  name: string
  icon: string
  headers: Array<any>
  openapi_schema: string
}

// 获取自定义API工具提供者响应接口
export type GetApiToolProviderResponse = {
  data: any
  id: string
  name: string
  // icon: string
  headers: Array<any>
  openapi_schema: string
  created_at: number
}
