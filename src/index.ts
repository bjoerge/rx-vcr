import {MonoTypeOperatorFunction} from 'rxjs'
import {fileStore} from './fileStore'
import {memoryStore} from './memoryStore'
import {ReplayOptions, VCRMode} from './types'
import {withStore} from './vcr'

export const vcr = <T>(
  mode: VCRMode,
  options?: ReplayOptions & {filename?: string},
): MonoTypeOperatorFunction<T> => {
  const store = options && options.filename ? fileStore<T>(options.filename) : memoryStore<T>()
  return withStore(store)(mode, options)
}
