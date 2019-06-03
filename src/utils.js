export function last(arr) {
  return arr[arr.length - 1];
}

let _uid = 0;
export function uid() {
  return _uid++;
}

let _lock = false;
export const lock = {
  acquire() {
    return _lock ? false : (_lock = true);
  },
  release() {
    _lock = false;
  }
};
