import { toast } from 'sonner'

export function useToast() {
  return {
    toast: (options: { title?: string; description?: string; variant?: 'default' | 'destructive' }) => {
      if (options.variant === 'destructive') {
        toast.error(options.title, {
          description: options.description,
        })
      } else {
        toast(options.title, {
          description: options.description,
        })
      }
    },
    success: (title: string, description?: string) => {
      toast.success(title, { description })
    },
    error: (title: string, description?: string) => {
      toast.error(title, { description })
    },
    info: (title: string, description?: string) => {
      toast.info(title, { description })
    },
  }
}
