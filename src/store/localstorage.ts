import {defer, from, of} from 'rxjs'
import {map, mergeMap} from 'rxjs/operators'

import {type RecordedValue, type RecordingStore} from '../types'

/**
 * Create store that will save to a given localStorage key
 * @public
 */
export function createLocalStorageStore<T>(key: string): RecordingStore<T> {
  const events: Array<RecordedValue<T>> = []
  return {
    hasRecording: () => localStorage.has(key),
    write: (value: RecordedValue<T>) => {
      events.push(value)
    },
    flush: () => {
      try {
        localStorage.setItem(key, JSON.stringify(events))
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err) || '<unknown error>')
        error.message = '[rx-vcr] Unable to write recorded events to file system: ' + error.message
        // eslint-disable-next-line no-console
        console.warn(error)
      }
    },
    recording$: defer(() =>
      of(key).pipe(
        mergeMap((path) => localStorage.getItem(path) || '[]'),
        map((contents: string): Array<RecordedValue<T>> => JSON.parse(contents)),
        mergeMap((values) => from(values)),
      ),
    ),
  }
}
