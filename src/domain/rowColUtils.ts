import { Block } from 'src/app/layout/game/game.component'

export function gridCoordFromDistance(
  x,
  y,
  cellSize,
  gutterSize
): { row: number; col: number } {
  const row = Math.round(y / (cellSize + gutterSize))
  const col = Math.round(x / (cellSize + gutterSize))

  return {
    row,
    col
  }
}

export function clamp(num, min, max) {
  return Math.max(Math.min(num, max), min)
}
