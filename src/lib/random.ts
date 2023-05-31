// Random float in [min, max[
export function float({ min, max }: { min: number, max: number }): number {
  return min + Math.random() * (max - min)
}

export function int({ min, max }: { min: number, max: number }): number {
  return min + Math.floor(Math.random() * (max - min + 1))
}

export function bool(): boolean {
  return Math.random() < 0.5
}
