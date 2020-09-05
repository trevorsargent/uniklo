import { Component, OnInit, ElementRef, OnDestroy } from '@angular/core'
import { SizeObserver } from '@service-work/size-observer'
import { ResizedEvent } from 'angular-resize-event'
import 'firebase/firestore'
import 'firebase/functions'

import * as firebase from 'firebase/app'

import { AngularFirestore } from '@angular/fire/firestore'
import * as uuid from 'uuid'
import { gridCoordFromDistance, clamp } from 'src/domain/rowColUtils'
import { BlockMove, BlockDrop } from 'src/app/components/block/block.component'

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit, OnDestroy {
  constructor(private db: AngularFirestore) {}

  private sizeObserver: SizeObserver

  NUM_ROWS = 10
  NUM_COLS = 10
  GUTTER_SIZE = 5

  dragCache = {
    row: 0,
    col: 0
  }

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

  blocks: RenderBlock[]

  reduceSolutions: CloudFunction
  addBlock: CloudFunction

  ngOnInit(): void {
    this.reduceSolutions = firebase.functions().httpsCallable('reduceSolutions')
    this.addBlock = firebase.functions().httpsCallable('addBlock')

    this.blocks = []
    this.db
      .collection('blocks')
      .valueChanges()
      .subscribe((blocks: Block[]) => {
        // purge deleted blocks
        this.blocks = this.blocks.filter(block =>
          blocks.map(b => b.id).includes(block.id)
        )

        blocks.forEach(block => {
          const updated = this.blocks.find(b => b.id === block.id)

          if (!updated) {
            this.blocks.push({
              id: block.id,
              color: block.color,
              isDragging: block.isDragging,
              left:
                block.col * this.cellSize + (block.col + 1) * this.gutterSize,
              top:
                block.row * this.cellSize + (block.row + 1) * this.gutterSize,
              size:
                block.level * this.cellSize +
                (block.level - 1) * this.gutterSize
            })
          } else {
            updated.left =
              block.col * this.cellSize + (block.col + 1) * this.gutterSize
            updated.top =
              block.row * this.cellSize + (block.row + 1) * this.gutterSize
            updated.isDragging = block.isDragging
          }
        })
      })
  }

  onResize($event: ResizedEvent) {
    this.GAME_WIDTH = $event.newWidth
  }

  onBlockDrag($event: BlockMove) {
    const block = this.blocks.find(b => b.id === $event.id)
    if (!block) {
      return
    }
    const { row, col } = gridCoordFromDistance(
      $event.x,
      $event.y,
      this.cellSize,
      this.gutterSize
    )

    const blockRef = this.db.collection('blocks').doc(block.id).ref

    const batch = this.db.firestore.batch()

    if (this.dragCache.row !== row) {
      const rowToInc = row - this.dragCache.row

      const incrementRows = firebase.firestore.FieldValue.increment(rowToInc)
      batch.set(
        blockRef,
        {
          row: incrementRows
        },
        { merge: true }
      )

      batch.set(blockRef, { isDragging: true }, { merge: true })

      this.dragCache.row = row
    }

    if (this.dragCache.col !== col) {
      const colToInc = col - this.dragCache.col
      const incrementCols = firebase.firestore.FieldValue.increment(colToInc)

      batch.set(
        blockRef,
        {
          col: incrementCols
        },
        { merge: true }
      )

      batch.set(blockRef, { isDragging: true }, { merge: true })

      this.dragCache.col = col
    }

    batch.commit()
  }

  onBlockDrop($event: BlockDrop) {
    this.dragCache = { row: 0, col: 0 }

    const blockRef = this.db.collection('blocks').doc($event.id).ref

    const batch = this.db.firestore.batch()

    batch.set(
      blockRef,
      {
        isDragging: false
      },
      { merge: true }
    )
    this.reduceSolutions({ blockId: $event.id }).then(res => console.log(res))

    batch.commit()
  }

  onBlockAdd() {
    this.addBlock({
      numRows: this.NUM_ROWS,
      numCols: this.NUM_COLS
    }).then(res => {
      console.log(res)
    })
  }

  ngOnDestroy() {
    // Remember to mark the `SizeObserver` as complete `OnDestroy`
    this.sizeObserver.complete()
  }
}

export interface Block {
  id: string
  row: number
  col: number
  color: string
  isDragging: boolean
  level: number
}

interface RenderBlock {
  id: string
  left: number
  top: number
  color: string
  isDragging: boolean
  size: number
}

interface BlockUpdateData {
  toCreate?: Block[]
  toDelete?: Block[]
  toUpdate?: Block[]
}

type CloudFunction = (...args) => any
