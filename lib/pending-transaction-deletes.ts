export class PendingTransactionDeletes {
  private readonly pending = new Map<number, {
    timer: ReturnType<typeof setTimeout>
    commit: () => void
  }>()

  schedule(id: number, commit: () => void) {
    this.cancel(id)
    const run = () => {
      if (this.cancel(id)) commit()
    }
    const timer = setTimeout(run, 5000)
    this.pending.set(id, { timer, commit: run })
  }

  cancel(id: number) {
    const entry = this.pending.get(id)
    if (!entry) return false
    clearTimeout(entry.timer)
    return this.pending.delete(id)
  }

  listen(page: EventTarget) {
    // A page entering the back/forward cache can be evicted without running
    // its timers again. Leaving the page ends the undo window there too.
    const flush = () => {
      for (const entry of this.pending.values()) entry.commit()
    }
    page.addEventListener("pagehide", flush)
    return () => {
      page.removeEventListener("pagehide", flush)
      flush()
    }
  }
}
