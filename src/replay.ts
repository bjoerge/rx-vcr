import {EMPTY, type Observable, of, throwError, timer} from 'rxjs'
import {concatMap, mapTo} from 'rxjs/operators'

import {type RecordedValue} from './types'

interface Options {
  speed?: number
  capDelay?: number
}

export const replayEvents =
  <T>(options: Options = {}) =>
  (events$: Observable<RecordedValue<T>>) => {
    const {speed = 1, capDelay = Number.MAX_VALUE} = options
    return events$.pipe(
      concatMap((event) => {
        const delay = Math.min(capDelay, typeof speed === 'number' ? event.ms * speed : 0)
        return delay === 0 ? of(event) : timer(delay).pipe(mapTo(event))
      }),
      concatMap((event): Observable<T> => {
        if (event.type === 'error') {
          return throwError(new Error(event.error.message))
        }
        if (event.type === 'next') {
          return of<T>(event.value)
        }
        return EMPTY
      }),
    )
  }
