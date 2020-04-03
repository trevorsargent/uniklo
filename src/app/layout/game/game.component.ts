import { Component, OnInit, ElementRef, OnDestroy } from '@angular/core'
import { SizeObserver } from '@service-work/size-observer'
import { ResizedEvent } from 'angular-resize-event'
import 'firebase/firestore'
import * as firebase from 'firebase/app'

import { AngularFirestore } from '@angular/fire/firestore'
import * as uuid from 'uuid'
import {
  findBlockByOrigin,
  gridCoordFromDistance,
  clamp
} from 'src/domain/rowColUtils'
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

  ngOnInit(): void {
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

  // findSolutionsAndMerge(block: Block): BlockUpdateData {
  //   const box4: Shape = [
  //     { row: 0, col: 1 },
  //     { row: 1, col: 1 },
  //     { row: 1, col: 0 }
  //   ]

  //   const shapes: Shape[] = [box4]

  //   const reflections: Reflection[] = [
  //     { row: 1, col: 1 },
  //     { row: 1, col: -1 },
  //     { row: -1, col: -1 },
  //     { row: -1, col: 1 }
  //   ]

  //   const level = block.level
  //   let foundShape: Shape
  //   const foundReflection: Reflection = reflections.find(r => {
  //     const shape = shapes.find(s => {
  //       return s.every(d => {
  //         const coord = {
  //           col: block.col + d.col * level * r.col,
  //           row: block.row + d.row * level * r.row
  //         }
  //         const b = findBlockByOrigin(this.blocks, coord.row, coord.col)
  //         if (b) {
  //           return b.level === level // whether block is a match
  //         }
  //         return false
  //       })
  //     })
  //     if (shape) {
  //       foundShape = shape
  //       return true
  //     }
  //     return false
  //   })

  //   if (!foundShape || !foundReflection) {
  //     return { toUpdate: [block] }
  //   }

  //   const blocksToMerge = foundShape.map((offset: Offset) => {
  //     const targetBlock = {
  //       row: block.row + offset.row * foundReflection.row * level,
  //       col: block.col + offset.col * foundReflection.col * level
  //     }
  //     const b = findBlockByOrigin(this.blocks, targetBlock.row, targetBlock.col)
  //     return b
  //   })

  //   blocksToMerge.push(block)

  //   const newBlockOrigin = blocksToMerge.reduce(
  //     (origin, b) => {
  //       return {
  //         row: Math.min(origin.row, b.row),
  //         col: Math.min(origin.col, b.col)
  //       }
  //     },
  //     {
  //       row: this.NUM_ROWS,
  //       col: this.NUM_COLS
  //     }
  //   )

  //   const blockToCreate = {
  //     row: newBlockOrigin.row,
  //     col: newBlockOrigin.col,
  //     level: level + 1,
  //     id: uuid.v4(),
  //     color: 'green',
  //     isDragging: false
  //   }

  //   return {
  //     toCreate: [blockToCreate],
  //     toDelete: blocksToMerge
  //   }
  // }

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

    batch.commit()
  }

  addBlock($event: MouseEvent) {
    const id = uuid.v4()

    const newBlock: Block = {
      col: 0,
      row: 0,
      level: 1,
      id,
      color: '#b20000',
      isDragging: false
    }
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

interface Offset {
  row: 0 | 1
  col: 0 | 1
}

type Shape = Offset[]

interface Reflection {
  row: 1 | -1
  col: 1 | -1
}

interface BlockUpdateData {
  toCreate?: Block[]
  toDelete?: Block[]
  toUpdate?: Block[]
}
