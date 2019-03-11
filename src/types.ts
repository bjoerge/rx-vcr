import {Observable} from 'rxjs'

export type VCRMode = 'auto' | 'record' | 'replay' | 'noop'

export interface ReplayOptions {
  speed?: number
}

export interface RecordedError {
  type: 'error'
  ms: number
  error: {
    message: string
  }
}

export interface RecordedNext<T> {
  type: 'next'
  ms: number
  value: T
}

export interface RecordedComplete<T> {
  type: 'complete'
  ms: number
}

export type RecordedValue<T> = RecordedNext<T> | RecordedError | RecordedComplete<T>

export interface RecordingStore<T> {
  hasRecording: () => boolean
  write: (event: RecordedValue<T>) => void
  flush: () => void
  recording$: Observable<RecordedValue<T>>
}
