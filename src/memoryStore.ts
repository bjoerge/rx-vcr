import {defer, from} from 'rxjs'

import {type RecordedValue, type RecordingStore} from './types'

export const memoryStore = <T>(): RecordingStore<T> => {
  let recording: Array<RecordedValue<T>> | null = null
  let buffer: Array<RecordedValue<T>> = []
  return {
    hasRecording: () => recording !== null,
    write: (value: RecordedValue<T>) => {
      buffer.push(value)
    },
    flush: () => {
      recording = buffer
      buffer = []
    },
    recording$: defer(() => from(recording || [])),
  }
}
