import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core'
import { gridCoordFromDistance } from 'src/domain/rowColUtils'

@Component({
  selector: 'app-block',
  templateUrl: './block.component.html',
  styleUrls: ['./block.component.css']
})
export class BlockComponent implements OnInit {
  @Input()
  block: Block

  @Output()
  blockMove = new EventEmitter<Block>()

  @Input()
  cellSize: number

  @Input()
  gutterSize: number

  get left() {
    return (
      this.block.col * this.cellSize + (this.block.col + 1) * this.gutterSize
    )
  }

  get top() {
    return (
      this.block.row * this.cellSize + (this.block.row + 1) * this.gutterSize
    )
  }

  get shadowTop() {
    return (
      this.block.shadowRow * this.cellSize +
      (this.block.shadowRow + 1) * this.gutterSize
    )
  }

  get shadowLeft() {
    return (
      this.block.shadowCol * this.cellSize +
      (this.block.shadowCol + 1) * this.gutterSize
    )
  }

  get size() {
    return (
      this.block.size * this.cellSize + (this.block.size - 1) * this.gutterSize
    )
  }

  constructor() {}

  ngOnInit(): void {
    this.block.shadowCol = this.block.col
    this.block.shadowRow = this.block.row
  }

  updateShadowPosition() {
    this.block.shadowCol = this.block.col
    this.block.shadowRow = this.block.row
  }

  onBlockDrop($event) {
    if (!$event.distance) {
      return
    }
    const { x, y } = $event.distance

    const { row: rowDelta, col: colDelta } = gridCoordFromDistance(
      x,
      y,
      this.cellSize,
      this.gutterSize
    )

    const newRow = this.block.row + rowDelta
    const newCol = this.block.col + colDelta

    const updatedBlock = {
      ...this.block,
      col: newCol,
      row: newRow
    }

    this.blockMove.emit(updatedBlock)
    $event.source.reset()
  }

  onBlockMove($event) {
    if (!$event.distance) {
      return
    }
    const { x, y } = $event.distance

    const { row: rowDelta, col: colDelta } = gridCoordFromDistance(
      x,
      y,
      this.cellSize,
      this.gutterSize
    )

    this.block.shadowCol = this.block.col + colDelta
    this.block.shadowRow = this.block.row + rowDelta
  }
}

export interface Block {
  row: number
  col: number
  shadowRow: number
  shadowCol: number
  size: number
  color: string
  id: string
}
