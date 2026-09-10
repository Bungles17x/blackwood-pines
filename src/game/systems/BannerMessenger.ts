export type BannerChangeHandler = (message: string | null) => void;

/**
 * Owns the transient HUD banner message and its auto-dismiss timer.
 * Replaces the copy-pasted `setTimeout(() => { if (this.bannerMessage === msg) ... })`
 * pattern scattered across HorrorEngine, and tracks the timer so it can be
 * cleared on dispose (prevents state updates after the engine is destroyed).
 */
export class BannerMessenger {
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private current: string | null = null;

  constructor(private onChange: BannerChangeHandler) { }

  show(message: string, durationMs: number): void {
    this.clearTimer();
    this.current = message;
    this.onChange(message);
    this.timerId = setTimeout(() => {
      this.timerId = null;
      this.clear();
    }, durationMs);
  }

  clear(): void {
    this.clearTimer();
    if (this.current !== null) {
      this.current = null;
      this.onChange(null);
    }
  }

  /** Cancels any pending auto-dismiss without emitting a change. */
  dispose(): void {
    this.clearTimer();
    this.current = null;
  }

  private clearTimer(): void {
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }
}
