export class Debouncer {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private requestId = 0;

  debounce(delayMs: number): Promise<number> {
    this.cancel();
    const id = ++this.requestId;

    return new Promise((resolve) => {
      this.timer = setTimeout(() => {
        this.timer = null;
        resolve(id);
      }, delayMs);
    });
  }

  isStale(id: number): boolean {
    return id !== this.requestId;
  }

  cancel(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  dispose(): void {
    this.cancel();
  }
}
