import {memoryStore, withStore} from 'rx-vcr'
import {fromEvent, interval} from 'rxjs'
import {switchMap, take, tap} from 'rxjs/operators'

const button = document.getElementById('button')
if (!button) {
  throw new Error('no button')
}

const vcr = withStore(memoryStore())

const click$ = fromEvent(button, 'click')
  .pipe(
    // eslint-disable-next-line no-console
    tap(() => console.log('clicked! emitting some numbers')),
    switchMap(() => interval(1000).pipe(take(10), vcr('auto'))),
    // eslint-disable-next-line no-console
    tap(console.log),
  )
  .subscribe()
