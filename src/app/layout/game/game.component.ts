import { Component, OnInit, ElementRef, OnDestroy } from '@angular/core'
import { Block } from 'src/app/components/block/block.component'
import { SizeObserverService, SizeObserver } from '@service-work/size-observer'
import { ResizedEvent } from 'angular-resize-event'
import { Observable } from 'rxjs'
import 'firebase/firestore'
import { AngularFirestore } from '@angular/fire/firestore'
import * as uuid from 'uuid'
import {
  gridCoordFromDistance,
  findBlockByOrigin
} from 'src/domain/rowColUtils'

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
        this.blocks = blocks
      })
  }

  onResize($event: ResizedEvent) {
    this.GAME_WIDTH = $event.newWidth
  }

  findSolutionsAndMerge(block: Block): BlockUpdateData {
    const box4: Shape = [
      { row: 0, col: 1 },
      { row: 1, col: 1 },
      { row: 1, col: 0 }
    ]

    const shapes: Shape[] = [box4]

    const reflections: Reflection[] = [
      { row: 1, col: 1 },
      { row: 1, col: -1 },
      { row: -1, col: -1 },
      { row: -1, col: 1 }
    ]

    const size = block.size
    let foundShape: Shape
    const foundReflection: Reflection = reflections.find(r => {
      const shape = shapes.find(s => {
        return s.every(d => {
          const coord = {
            col: block.col + d.col * size * r.col,
            row: block.row + d.row * size * r.row
          }
          const b = findBlockByOrigin(this.blocks, coord.row, coord.col)
          if (b) {
            return b.size === size // whether block is a match
          }
          return false
        })
      })
      if (shape) {
        foundShape = shape
        return true
      }
      return false
    })

    if (!foundShape || !foundReflection) {
      return { toUpdate: [block] }
    }

    const blocksToMerge = foundShape.map((offset: Offset) => {
      const targetBlock = {
        row: block.row + offset.row * foundReflection.row * size,
        col: block.col + offset.col * foundReflection.col * size
      }
      const b = findBlockByOrigin(this.blocks, targetBlock.row, targetBlock.col)
      return b
    })

    blocksToMerge.push(block)

    const newBlockOrigin = blocksToMerge.reduce(
      (origin, b) => {
        return {
          row: Math.min(origin.row, b.row),
          col: Math.min(origin.col, b.col)
        }
      },
      {
        row: this.NUM_ROWS,
        col: this.NUM_COLS
      }
    )

    const blockToCreate = {
      row: newBlockOrigin.row,
      col: newBlockOrigin.col,
      shadowCol: newBlockOrigin.col,
      shadowRow: newBlockOrigin.row,
      size: size * 2,
      id: uuid.v4(),
      color: 'green'
    }

    return {
      toCreate: [blockToCreate],
      toDelete: blocksToMerge
    }
  }

  onBlockMove(block: Block) {
    block.row = Math.max(Math.min(block.row, this.NUM_ROWS - 1), 0)
    block.col = Math.max(Math.min(block.col, this.NUM_COLS - 1), 0)

    const blockUpdates = this.findSolutionsAndMerge(block)

    this.update(blockUpdates)
  }

  private update(blockUpdates: BlockUpdateData) {
    const batch = this.firestore.firestore.batch()

    if (blockUpdates.toCreate) {
      blockUpdates.toCreate.forEach(b => {
        const ref = this.firestore.collection('blocks').doc(b.id).ref
        batch.set(ref, b)
      })
    }
    if (blockUpdates.toUpdate) {
      blockUpdates.toUpdate.forEach(b => {
        const ref = this.firestore.collection('blocks').doc(b.id).ref
        batch.update(ref, b)
      })
    }

    if (blockUpdates.toDelete) {
      blockUpdates.toDelete.forEach(b => {
        const ref = this.firestore.collection('blocks').doc(b.id).ref
        batch.delete(ref)
      })
    }

    batch.commit()
  }

  addBlock($event: MouseEvent) {
    const id = uuid.v4()
    this.firestore
      .collection('blocks')
      .doc(id)
      .set({
        col: 0,
        row: 0,
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
