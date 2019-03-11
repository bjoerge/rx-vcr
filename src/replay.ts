import {EMPTY, Observable, of, throwError, timer} from 'rxjs'
import {concatMap, mapTo} from 'rxjs/operators'
import {RecordedValue} from './types'

export const replayEvents = <T>(speed?: number) => (events$: Observable<RecordedValue<T>>) =>
  events$.pipe(
    concatMap(event =>
      typeof speed === 'undefined' ? of(event) : timer(event.ms * speed).pipe(mapTo(event)),
    ),
    concatMap(
      (event): Observable<T> => {
        if (event.type === 'error') {
          return throwError(new Error(event.error.message))
        }
        if (event.type === 'next') {
          return of<T>(event.value)
        }
        return EMPTY
      },
    ),
  )
