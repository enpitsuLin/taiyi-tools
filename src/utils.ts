function waitForEvent<T>(target: EventTarget, event: string): Promise<T> {
  return new Promise<T>((resolve) => {
    target.addEventListener(
      event,
      (e) => {
        resolve(e as T)
      },
      { once: true }
    )
  })
}


export const utils = {
  waitForEvent
}
