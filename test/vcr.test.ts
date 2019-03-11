import {concat, defer, interval, of, range, throwError, timer} from 'rxjs'
import {catchError, concatMap, map, mapTo, mergeMap, take, tap, toArray} from 'rxjs/operators'
import tempy from 'tempy'
import {fileStore} from '../src/fileStore'
import {memoryStore} from '../src/memoryStore'
import {withStore} from '../src/rx-vcr'
import {testObservable as test} from './testObservable'
import {vcr as exportedVCR} from '../src'
import {VCRMode} from '../src/types'
import {replayEvents} from '../src/replay'

const testAuto = (storeName: string, operator: typeof exportedVCR) => {
  test(`Using ${storeName}: auto calls source observable only once`, () => {
    let sideEffectCallCount = 0
    const sideEffect$ = defer(() => {
      sideEffectCallCount++
      return range(10).pipe(
        concatMap(() => timer(10)),
        mapTo({result: 'foo'}),
      )
    })

    const record$ = sideEffect$.pipe(operator('auto'))
    return concat(record$, timer(10).pipe(mergeMap(() => record$))).pipe(
      tap({
        complete: () => {
          expect(sideEffectCallCount).toBe(1)
        },
      }),
    )
  })
}

testAuto('default (no filename)', exportedVCR)
testAuto('default (with filename)', (mode: VCRMode) => exportedVCR(mode, {filename: tempy.file()}))
testAuto('memory store', withStore(memoryStore()))
testAuto('file store', withStore(fileStore(tempy.file())))

test(`record mode actually records events`, () => {
  const events$ = defer(() =>
    range(10).pipe(
      concatMap(() => timer(10)),
      mapTo({result: 'foo'}),
    ),
  )
  const store = memoryStore()
  const vcr = withStore(store)

  return events$.pipe(
    vcr('auto'),
    toArray(),
    mergeMap(sourceEvents =>
      store.recording$.pipe(
        replayEvents(),
        toArray(),
        map(recordedEvents => [sourceEvents, recordedEvents]),
      ),
    ),
    tap(([sourceEvents, recordedEvents]) => expect(sourceEvents).toEqual(recordedEvents)),
  )
})

test(`recording an observable that fails`, () => {
  let callCount = 0
  const events$ = defer(() => {
    callCount++
    return range(10).pipe(
      concatMap(n => timer(10).pipe(mapTo(n))),
      mergeMap(n => (n > 4 ? throwError(new Error(`Invalid number: ${n}`)) : of(n))),
      map(n => ({square: n * n})),
    )
  })

  const store = memoryStore()
  const vcr = withStore(store)
  const recorded$ = events$.pipe(
    vcr('auto'),
    catchError(err => of(err)),
  )
  return recorded$.pipe(
    toArray(),
    mergeMap(sourceEvents =>
      recorded$.pipe(
        toArray(),
        map(recordedEvents => [sourceEvents, recordedEvents]),
      ),
    ),
    tap(([sourceEvents, recordedEvents]) => {
      expect(callCount).toBe(1)
      expect(sourceEvents).toEqual(recordedEvents)
    }),
  )
})

test(`replaying when there's no recording available`, () => {
  let callCount = 0
  const events$ = defer(() => {
    callCount++
    return range(10).pipe(
      concatMap(n => timer(10).pipe(mapTo(n))),
      mergeMap(n => (n > 4 ? throwError(new Error(`Invalid number: ${n}`)) : of(n))),
      map(n => ({square: n * n})),
    )
  })

  const store = fileStore(tempy.file())
  const vcr = withStore(store)
  const recorded$ = events$.pipe(
    vcr('replay'),
    catchError(err => of(err)),
  )
  return recorded$.pipe(
    toArray(),
    mergeMap(sourceEvents =>
      recorded$.pipe(
        toArray(),
        map(recordedEvents => [sourceEvents, recordedEvents]),
      ),
    ),
    tap(([sourceEvents, recordedEvents]) => {
      expect(callCount).toBe(2)
      expect(sourceEvents).toEqual(recordedEvents)
    }),
  )
})

test(`noop mode`, () => {
  let callCount = 0
  const events$ = defer(() => {
    callCount++
    return range(10)
  })

  const store = memoryStore()
  const vcr = withStore(store)
  const noop$ = events$.pipe(vcr('noop'))

  return noop$.pipe(
    toArray(),
    mergeMap(sourceEvents =>
      noop$.pipe(
        toArray(),
        map(recordedEvents => [sourceEvents, recordedEvents]),
      ),
    ),
    tap(([sourceEvents, recordedEvents]) => {
      expect(callCount).toBe(2)
      expect(sourceEvents).toEqual(recordedEvents)
    }),
  )
})

test(`record mode`, () => {
  let callCount = 0
  const events$ = defer(() => {
    callCount++
    return range(10)
  })

  const store = memoryStore()
  const vcr = withStore(store)
  const noop$ = events$.pipe(vcr('record'))

  return noop$.pipe(
    toArray(),
    mergeMap(sourceEvents =>
      noop$.pipe(
        toArray(),
        map(recordedEvents => [sourceEvents, recordedEvents]),
      ),
    ),
    tap(([sourceEvents, recordedEvents]) => {
      expect(callCount).toBe(2)
      expect(sourceEvents).toEqual(recordedEvents)
    }),
  )
})

test(`replay with speed`, () => {
  let start: Date
  const INTERVAL = 10
  const VALUES = 4
  const REPLAY_SPEED = 2
  const events$ = defer(() => {
    start = new Date()
    return interval(INTERVAL).pipe(take(VALUES))
  })

  const store = memoryStore()
  const vcr = withStore(store)

  const values$ = events$.pipe(vcr('auto', {speed: REPLAY_SPEED}))

  let durationActualRun: number
  let durationReplay: number
  return values$.pipe(
    toArray(),
    tap(() => (durationActualRun = new Date().getTime() - start.getTime())),
    mergeMap(sourceEvents => {
      const startReplay = new Date()
      return values$.pipe(
        toArray(),
        tap(() => (durationReplay = new Date().getTime() - startReplay.getTime())),
        map(recordedEvents => [sourceEvents, recordedEvents]),
      )
    }),
    tap(([sourceEvents, recordedEvents]) => {
      expect(sourceEvents).toEqual(recordedEvents)
      expect(durationActualRun).toBeGreaterThan(INTERVAL * VALUES - 10)
      expect(durationActualRun).toBeLessThan(INTERVAL * VALUES + 10)
      expect(durationReplay).toBeGreaterThan(INTERVAL * VALUES * REPLAY_SPEED - 50)
      expect(durationReplay).toBeLessThan(INTERVAL * VALUES * REPLAY_SPEED + 50)
    }),
  )
})
