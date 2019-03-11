import {defer, MonoTypeOperatorFunction, Observable} from 'rxjs'
import {tap} from 'rxjs/operators'
import {replayEvents} from './replay'
import {RecordingStore, ReplayOptions, VCRMode} from './types'

export const record = <T>(store: RecordingStore<T>) => (input$: Observable<T>) => {
  let prev = new Date()
  return input$.pipe(
    tap({
      next: value => {
        const now = new Date()
        store.write({type: 'next', ms: now.getTime() - prev.getTime(), value})
        prev = now
      },
      error: (error: Error) => {
        const now = new Date()
        store.write({
          type: 'error',
          ms: now.getTime() - prev.getTime(),
          error: {
            message: error.message,
          },
        })
        store.flush()
      },
      complete: () => {
        const now = new Date()
        store.write({
          type: 'complete',
          ms: now.getTime() - prev.getTime(),
        })
        store.flush()
      },
    }),
  )
}

export const replay = <T>(store: RecordingStore<T>, options?: ReplayOptions) => (
  input$: Observable<T>,
): Observable<T> => {
  const speed = options && options.speed
  if (!store.hasRecording()) {
    // tslint:disable-next-line:no-console
    console.warn('[rx-vcr] In replay mode, but no recording found in file')
    return input$
  }
  return store.recording$.pipe(replayEvents(speed))
}

const checkRecording = <T>(store: RecordingStore<T>, options?: ReplayOptions) => (
  input$: Observable<T>,
) => {
  return defer(() =>
    store.hasRecording() ? input$.pipe(replay(store, options)) : input$.pipe(record(store)),
  )
}

export const withStore = <T>(store: RecordingStore<T>) => (
  mode: VCRMode,
  options?: ReplayOptions,
): MonoTypeOperatorFunction<T> => {
  if (mode === 'record') {
    return record(store)
  }
  if (mode === 'replay') {
    return replay(store, options)
  }
  if (mode === 'auto') {
    return checkRecording(store, options)
  }
  return (source$: Observable<T>) => source$
}
