export function gridCoordFromDistance(x, y, cellSize, gutterSize) {
  const row = Math.round(y / (cellSize + gutterSize))
  const col = Math.round(x / (cellSize + gutterSize))

  return {
    row,
    col
  }
}
