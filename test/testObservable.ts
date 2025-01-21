import {type Observable} from 'rxjs'
import {test} from 'vitest'

export const testObservable = (name: string, fn: (...args: any[]) => Observable<any>) => {
  test(name, () => fn().toPromise())
}
