const {vcr} = require('rx-vcr')
const {range, timer} = require('rxjs')
const {concatMap, mapTo, map} = require('rxjs/operators')

const squares$ = range(100).pipe(
  concatMap(n => timer(100).pipe(mapTo(n))),
  map(n => n ** n),
  vcr('auto', {filename: 'squares-recording.json', speed: 0.2}),
)

squares$.subscribe(console.log)
