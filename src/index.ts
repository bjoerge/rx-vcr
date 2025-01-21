import {type MonoTypeOperatorFunction} from 'rxjs'

import {memoryStore} from './memoryStore'
import {type RecordingStore, type ReplayOptions, type VCRMode} from './types'
import {withStore} from './vcr'

export {memoryStore, withStore}
/**
 *
 * @param mode
 * @param options
 * @public
 */
export const vcr = <T>(
  mode: VCRMode,
  options?: ReplayOptions & {getStorage?: () => RecordingStore<T>},
): MonoTypeOperatorFunction<T> => {
  const getStorage = options?.getStorage ?? memoryStore
  return withStore(getStorage())(mode, options)
}
