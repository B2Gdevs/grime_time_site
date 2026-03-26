export type AdminPreviewUser = {
  email: string
  id: number | string
  name: string
}

export type AdminPreviewSearchUser = AdminPreviewUser & {
  accountName: null | string
  company: null | string
}

