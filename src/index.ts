import {type MonoTypeOperatorFunction} from 'rxjs'

import {createMemoryStore} from './store/memory'
import {type RecordingStore, type ReplayOptions, type VCRMode} from './types'
import {withStore} from './vcr'

export {withStore}
/**
 *
 * @param mode
 * @param options
 * @public
 */
export const vcr = <T>(
  mode: VCRMode,
  options?: ReplayOptions & {store: RecordingStore<T>},
): MonoTypeOperatorFunction<T> => {
  return withStore(options?.store ?? createMemoryStore<T>())(mode, options)
}
