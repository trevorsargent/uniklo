import { Block } from 'src/app/components/block/block.component'

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

export function findBlockByOrigin(blocks: Block[], row, col): Block | null {
  return (
    blocks.find(b => {
      return b.row === row && b.col === col
    }) || null
  )
}
