import {fromEvent, interval, of} from 'rxjs'
import {switchMap, take, tap} from 'rxjs/operators'
import {memoryStore} from '../src/memoryStore'
import {withStore} from '../src/rx-vcr'

const button = document.getElementById('button')
if (!button) {
  throw new Error('no button')
}

const vcr = withStore(memoryStore())

const click$ = fromEvent(button, 'click')
  .pipe(
    tap(() => console.log('clicked! emitting some numbers')),
    switchMap(() =>
      interval(1000).pipe(
        take(10),
        vcr('auto'),
      ),
    ),
    tap(console.log),
  )
  .subscribe()
