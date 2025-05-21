"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToastOptions } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: `
            group toast
            bg-background/80 backdrop-blur-md
            text-foreground
            border border-border
            shadow-lg
            rounded-lg
            p-4
            w-full
            max-w-md
          `,
          title: "font-medium",
          description: "text-muted-foreground text-sm",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-muted text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }