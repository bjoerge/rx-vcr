import {fileStore} from './fileStore'
import {memoryStore} from './memoryStore'
import {withStore} from './rx-vcr'
import {ReplayOptions, VCRMode} from './types'

export const vcr = (mode: VCRMode, options?: ReplayOptions & {filename?: string}) => {
  const store = options && options.filename ? fileStore(options.filename) : memoryStore()
  return withStore(store)(mode, options)
}
