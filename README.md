# rx-vcr 🎥

Record and replay RxJS streams

### Usage

```js
import {vcr} from 'rx-vcr'
import {range, timer} from 'rxjs'
import {concatMap, mapTo, map} from 'rxjs/operators'

const squares$ = range(100).pipe(
  concatMap(n => timer(100).pipe(mapTo(n))),
  map(n => n ** n),
  vcr('auto', {filename: 'squares-recording.json', speed: 0.2}),
)

squares$.subscribe(console.log)
```

This will record all values passed through the stream, and when it completes write them to the file at the `my-recording.json` path. Next time the stream is subscribed to, the values will be read from the recordings file, and emitted immediately.

By default the recorded events will be delivered immediately, but the events can be emitted in the same speed as they arrived in the original file by passing a `speed` option. This value is a speed multiplier, so emit the values twice as fast as when recording by passing `{speed: 0.5}`. Slow it down to use twice as long time as it originally used by passing `{speed: 2}`, etc.

```js
const squares$ = range(100).pipe(
  concatMap(n => timer(100).pipe(mapTo(n))),
  map(n => n ** n),
  vcr('auto', {filename: 'squares-recording.json', speed: 0.2}),
)
```
