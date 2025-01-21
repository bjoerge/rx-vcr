import {existsSync} from 'node:fs'
import {readFile, writeFile} from 'node:fs/promises'

import {defer, from, of} from 'rxjs'
import {map, mergeMap} from 'rxjs/operators'

import {type RecordedValue, type RecordingStore} from './types'

interface Fs {
  existsSync: (path: string) => boolean
  writeFile: (path: string, data: string) => Promise<void>
  readFile: (path: string) => Promise<string>
}

export const withFs =
  (fileSys: Fs) =>
  <T>(filename: string): RecordingStore<T> => {
    const events: Array<RecordedValue<T>> = []
    return {
      hasRecording: () => fileSys.existsSync(filename),
      write: (value: RecordedValue<T>) => {
        events.push(value)
      },
      flush: () => {
        fileSys.writeFile(filename, JSON.stringify(events)).catch((err) => {
          /* istanbul ignore if  */
          if (err) {
            // eslint-disable-next-line no-console
            console.warn('[rx-vcr] Unable to write recorded events to file system' + err.stack)
          }
        })
      },
      recording$: defer(() =>
        of(filename).pipe(
          mergeMap((path) => fileSys.readFile(path)),
          map((contents: string): Array<RecordedValue<T>> => JSON.parse(contents)),
          mergeMap((values) => from(values)),
        ),
      ),
    }
  }

export const fileStore = withFs({
  existsSync: (path: string) => existsSync(path),
  writeFile: (path: string, data: string) => writeFile(path, data),
  readFile: (path: string) => readFile(path, 'utf-8'),
})
