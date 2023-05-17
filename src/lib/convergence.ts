interface Params {
  from: number,
  to: number,
  dt: number,
  time: number,
}

export function converge({ from, to, dt, time }: Params): number {
  return time === 0
    ? to
    : from + (to - from) * dt / time
}
