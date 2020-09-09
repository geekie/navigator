/** @flow */

export function last<T>(arr: Array<T>): T {
  return arr[arr.length - 1];
}

let _uid = 0;
export function uid() {
  return _uid++;
}
