import * as fs from 'fs'
import {defer, from, of} from 'rxjs'
import {map, mergeMap} from 'rxjs/operators'
import {RecordedValue, RecordingStore} from './types'

interface Fs {
  existsSync: (path: string) => boolean
  writeFile: (path: string, data: string, callback: (err: any) => void) => void
  readFileSync: (path: string, encoding: string) => any
}

const readFile = (filename: string) => fs.readFileSync(filename, 'utf-8')

export const withFs = (fileSys: Fs) => <T>(filename: string): RecordingStore<T> => {
  const events: Array<RecordedValue<T>> = []
  return {
    hasRecording() {
      return fileSys.existsSync(filename)
    },
    write(value: RecordedValue<T>) {
      events.push(value)
    },
    flush() {
      fileSys.writeFile(filename, JSON.stringify(events), err => {
        /* istanbul ignore if  */
        if (err) {
          // tslint:disable-next-line:no-console
          console.warn('[rx-vcr] Unable to write recorded events to file system' + err.stack)
        }
      })
    },
    recording$: defer(() =>
      of(filename).pipe(
        map(readFile),
        map((contents: string): Array<RecordedValue<T>> => JSON.parse(contents)),
        mergeMap(values => from(values)),
      ),
    ),
  }
}

export const fileStore = withFs(fs)
