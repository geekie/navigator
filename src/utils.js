export function last(arr) {
  return arr[arr.length - 1];
}

let _uid = 0;
export function uid() {
  return _uid++;
}
