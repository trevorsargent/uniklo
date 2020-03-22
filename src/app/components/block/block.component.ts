import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core'

@Component({
  selector: 'app-block',
  templateUrl: './block.component.html',
  styleUrls: ['./block.component.css']
})
export class BlockComponent implements OnInit {
  @Input()
  block: Block

  @Input()
  gridSize: number

  @Input()
  gutterPercent: number

  @Input()
  gameSize: number

  @Output()
  blockMove = new EventEmitter<Block>()

  shadowCol = -1
  shadowRow = -1

  get cellPercent() {
    return (100 - (this.gridSize + 1) * this.gutterPercent) / this.gridSize
  }

  get cellSize() {
    return this.gameSize * this.cellPercent * 0.01
  }

  get gutterSize() {
    return this.gameSize * this.gutterPercent * 0.01
  }

  get left() {
    return (
      this.block.col * this.cellPercent +
      (this.block.col + 1) * this.gutterPercent
    )
  }

  get top() {
    return (
      this.block.row * this.cellPercent +
      (this.block.row + 1) * this.gutterPercent
    )
  }

  get shadowTop() {
    return (
      this.shadowRow * this.cellPercent +
      (this.shadowRow + 1) * this.gutterPercent
    )
  }

  get shadowLeft() {
    return (
      this.shadowCol * this.cellPercent +
      (this.shadowCol + 1) * this.gutterPercent
    )
  }

  get size() {
    return (
      this.block.size * this.cellPercent +
      (this.block.size - 1) * this.gutterPercent
    )
  }

  constructor() {}

  ngOnInit(): void {
    this.shadowCol = this.block.col
    this.shadowRow = this.block.row
  }

  onBlockDrop($event) {
    console.log('drop', $event)
    if (!$event.distance) {
      return
    }
    const { x, y } = $event.distance

    const rowDelta = Math.round(y / (this.cellSize + this.gutterSize))
    const colDelta = Math.round(x / (this.cellSize + this.gutterSize))

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

    const rowDelta = Math.round(y / (this.cellSize + this.gutterSize))
    const colDelta = Math.round(x / (this.cellSize + this.gutterSize))

    this.shadowCol = this.block.col + colDelta
    this.shadowRow = this.block.row + rowDelta
  }
}

export interface Block {
  row: number
  col: number
  size: number
  color: string
  id: string
}
