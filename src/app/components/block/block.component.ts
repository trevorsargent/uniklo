import {
  Component,
  OnInit,
  Input,
  EventEmitter,
  Output,
  OnChanges
} from '@angular/core'
import { gridCoordFromDistance } from 'src/domain/rowColUtils'
import { CdkDragMove, CdkDragEnd } from '@angular/cdk/drag-drop'

@Component({
  selector: 'app-block',
  templateUrl: './block.component.html',
  styleUrls: ['./block.component.css']
})
export class BlockComponent implements OnInit {
  @Input()
  left: number

  @Input()
  top: number

  @Input()
  size: number

  @Input()
  color: string

  @Input()
  id: string

  private _isDragging: boolean
  @Input()
  set isDragging(v) {
    this._isDragging = v
    if (!this.userIsDragging) {
      this.resetDragOrigin()
    }
  }

  get isDragging() {
    return this._isDragging
  }

  userIsDragging

  @Output()
  blockDrag = new EventEmitter<BlockMove>()

  @Output()
  blockDrop = new EventEmitter<BlockDrop>()

  dragOrigin: {
    top: number
    left: number
  }

  resetDragOrigin() {
    this.dragOrigin = {
      left: this.left ?? 0,
      top: this.top ?? 0
    }
  }

  ngOnInit(): void {
    this.resetDragOrigin()
  }

  onBlockDrop($event: CdkDragEnd) {
    this.userIsDragging = false
    $event.source.reset()
    this.blockDrop.emit({
      id: this.id
    })
    this.resetDragOrigin()
  }

  onBlockMove($event: CdkDragMove) {
    this.userIsDragging = true

    if (!$event.distance) {
      return
    }
    const { x, y } = $event.distance

    this.blockDrag.emit({
      id: this.id,
      x,
      y
    })
  }
}

export interface BlockDrop {
  id: string
}

export interface BlockMove {
  id: string
  x: number
  y: number
}
