import { Component, OnInit, ElementRef, OnDestroy } from '@angular/core'
import { Block } from 'src/app/components/block/block.component'
import { SizeObserverService, SizeObserver } from '@service-work/size-observer'
import { ResizedEvent } from 'angular-resize-event'
import { Observable } from 'rxjs'
import 'firebase/firestore'
import { AngularFirestore } from '@angular/fire/firestore'
import * as uuid from 'uuid'
import { gridCoordFromDistance } from 'src/domain/rowColUtils'

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit, OnDestroy {
  constructor(private firestore: AngularFirestore) {}

  private sizeObserver: SizeObserver

  NUM_ROWS = 10
  NUM_COLS = 10
  GUTTER_SIZE = 5

  // Responsive to Window
  GAME_WIDTH

  get cellSize() {
    return (
      (this.GAME_WIDTH - (this.NUM_COLS + 1) * this.GUTTER_SIZE) / this.NUM_COLS
    )
  }

  get gutterSize() {
    return this.GUTTER_SIZE
  }

  blocks: Block[]

  ngOnInit(): void {
    this.blocks = []
    this.firestore
      .collection('blocks')
      .valueChanges()
      .subscribe((blocks: Block[]) => {
        blocks.forEach(block => {
          const toUpdate = this.blocks.find(b => b.id === block.id)
          if (!toUpdate) {
            this.blocks.push({
              ...block
            })
          } else {
            toUpdate.col = block.col
            toUpdate.row = block.row
            toUpdate.shadowRow = block.row
            toUpdate.shadowCol = block.col
          }
        })
      })
  }

  onResize($event: ResizedEvent) {
    this.GAME_WIDTH = $event.newWidth
  }

  onBlockMove(block: Block) {
    block.row = Math.max(Math.min(block.row, this.NUM_ROWS - 1), 0)
    block.col = Math.max(Math.min(block.col, this.NUM_COLS - 1), 0)

    this.firestore
      .collection('blocks')
      .doc(block.id)
      .set(block)
  }

  addBlock($event) {
    console.log($event)
    const x = $event.offsetX
    const y = $event.offsetY

    const { row, col } = gridCoordFromDistance(
      x,
      y,
      this.cellSize,
      this.gutterSize
    )

    const id = uuid.v4()
    this.firestore
      .collection('blocks')
      .doc(id)
      .set({
        row,
        col,
        size: 1,
        id,
        color: '#b20000'
      })
  }

  ngOnDestroy() {
    // Remember to mark the `SizeObserver` as complete `OnDestroy`
    this.sizeObserver.complete()
  }
}
