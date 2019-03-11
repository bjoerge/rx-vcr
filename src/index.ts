import {fileStore} from './fileStore'
import {memoryStore} from './memoryStore'
import {ReplayOptions, VCRMode} from './types'
import {withStore} from './vcr'

export const vcr = (mode: VCRMode, options?: ReplayOptions & {filename?: string}) => {
  const store = options && options.filename ? fileStore(options.filename) : memoryStore()
  return withStore(store)(mode, options)
}
