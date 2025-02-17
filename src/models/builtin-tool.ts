import { type BaseResponse } from './base'

// 获取内置插件分类接口响应接口
export type GetCategoriesResponse = BaseResponse<
  Array<{
    category: string
    icon: string
    name: string
  }>
>

// 获取所有内置插件列表
export type GetBuiltinToolsResponse = BaseResponse<
  Array<{
    background: string
    category: string
    create_at: number
    description: string
    label: string
    name: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools: Array<any>
  }>
>
