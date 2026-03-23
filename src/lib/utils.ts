import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCoordinate(value: number, type: 'lat' | 'lng'): string {
  const direction = type === 'lat'
    ? (value >= 0 ? 'N' : 'S')
    : (value >= 0 ? 'E' : 'W')
  return `${Math.abs(value).toFixed(4)}° ${direction}`
}

export function formatSpeed(speed: string | number | null): string {
  if (!speed) return 'N/A'
  const numSpeed = typeof speed === 'string' ? parseFloat(speed) : speed
  return `${numSpeed.toFixed(1)} kn`
}

export function formatCourse(course: string | number | null): string {
  if (!course) return 'N/A'
  const numCourse = typeof course === 'string' ? parseFloat(course) : course
  return `${numCourse.toFixed(0)}°`
}

export function roundToDecimal(value: number, decimals: number = 1): number {
  const multiplier = Math.pow(10, decimals)
  return Math.round(value * multiplier) / multiplier
}
