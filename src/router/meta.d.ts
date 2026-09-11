import 'vue-router'
import type { AppRole } from '@/types/domain'

declare module 'vue-router' {
  interface RouteMeta {
    public?: boolean
    roles?: AppRole[]
    title?: string
  }
}
