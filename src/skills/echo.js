export function echo(value) {
  if (typeof value !== "string") {
    throw new TypeError("echo only accepts strings");
  }
  return value;
}
