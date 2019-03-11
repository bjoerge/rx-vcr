import {Observable} from 'rxjs'

export const testObservable = (name: string, fn: (...args: any[]) => Observable<any>) => {
  test(name, () => fn().toPromise())
}
