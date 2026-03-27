type Props = {
  message: string
}

export function AuthNotice({ message }: Props) {
  return (
    <div className="rounded-md border border-primary/20 bg-primary/10 px-3 py-2 text-sm text-foreground">
      {message}
    </div>
  )
}
