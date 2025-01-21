import {defer, type MonoTypeOperatorFunction, type Observable} from 'rxjs'
import {tap} from 'rxjs/operators'

import {replayEvents} from './replay'
import {type RecordingStore, type ReplayOptions, type VCRMode} from './types'

export const record =
  <T>(store: RecordingStore<T>) =>
  (input$: Observable<T>) => {
    let prev = new Date()
    return input$.pipe(
      tap({
        next: (value) => {
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

export const replay = <T>(store: RecordingStore<T>, options: ReplayOptions = {}) => {
  return (input$: Observable<T>): Observable<T> => {
    if (!store.hasRecording()) {
      // eslint-disable-next-line no-console
      console.warn('[rx-vcr] In replay mode, but no recording found in file')
      return input$
    }
    return store.recording$.pipe(replayEvents({speed: options.speed, capDelay: options.capDelay}))
  }
}

const checkRecording =
  <T>(store: RecordingStore<T>, options?: ReplayOptions) =>
  (input$: Observable<T>) => {
    return defer(() =>
      store.hasRecording() ? input$.pipe(replay(store, options)) : input$.pipe(record(store)),
    )
  }

/**
 *
 * @param store
 * @public
 */
export const withStore =
  <T>(store: RecordingStore<T>) =>
  (mode: VCRMode, options?: ReplayOptions): MonoTypeOperatorFunction<T> => {
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
