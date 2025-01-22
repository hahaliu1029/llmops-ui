// 基础响应数据格式
export type BaseResponse<T> = {
  code: string
  data: T
  message: string
}

// 基础响应分页数据格式
export type BasePaginatorResponse<T> = BaseResponse<{
  list: Array<T>
  paginator: {
    total_page: number
    total_record: number
    current_page: number
    page_size: number
  }
}>
