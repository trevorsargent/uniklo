import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as uuid from 'uuid/v4'

admin.initializeApp()
const db = admin.firestore()

export const reduceSolutions = functions.https.onCall(async (data, context) => {
  const blockId = data.blockId

  const snapshots = await Promise.all(
    await db
      .collection('blocks')
      .listDocuments()
      .then(docs => docs.map(doc => doc.get()))
  )

  const blocks: Block[] = snapshots.map(
    shot =>
      ({
        col: shot.get('col'),
        row: shot.get('row'),
        level: shot.get('level'),
        id: shot.get('id')
      } as Block)
  )

  // return { blocks, blockId }

  const block =
    blocks.find(b => {
      return b.id === blockId
    }) ?? ({} as Block)

  if (!block.id) {
    throw new Error('cannot find block')
  }

  return findSolutionsAndMerge(block, blocks)
})

export const addBlock = functions.https.onCall(async (data, context) => {
  const { numRows, numCols } = data

  const blocks: Block[] = await (await db.collection('blocks').get()).docs.map(
    d => d.data() as Block
  )

  const cell = getFreeCell(numRows, numCols, blocks)

  const block: Block = {
    //defaults
    col: 0,
    row: 0,
    id: uuid(),
    level: 1,
    // overwrite with random data if available
    ...cell
  }

  return db
    .collection('blocks')
    .doc(block.id)
    .set(block)
})

const getFreeCell = (
  numRows: number,
  numCols: number,
  blocks: Block[]
): Cell => {
  const cell = {
    row: random(numRows),
    col: random(numCols)
  }

  const collision = blocks.find(b => {
    return (
      cell.col === b.col - (b.level - 1) || cell.row === b.row - (b.level - 1)
    )
  })

  if (!collision) {
    return cell
  }

  return getFreeCell(numRows, numCols, blocks)
}

const random = (scaler: number) => {
  return Math.floor(Math.random() * scaler)
}

const findSolutionsAndMerge = (block: Block, blocks: Block[]) => {
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

  const level = block.level
  let foundShape: Shape = []
  const foundReflection: Reflection | undefined = reflections.find(r => {
    const shape = shapes.find(s => {
      return s.every(d => {
        const coord = {
          col: block.col + d.col * level * r.col,
          row: block.row + d.row * level * r.row
        }
        const b = findBlockByOrigin(blocks, coord.row, coord.col)
        if (b) {
          return b.level === level // whether block is a match
        }
        return false
      })
    })
    if (shape?.length) {
      foundShape = shape
      return true
    }
    return false
  })

  if (!foundShape || !foundReflection) {
    return { toUpdate: [block] }
  }

  const blocksToMerge = foundShape
    .map((offset: Offset) => {
      const targetBlock = {
        row: block.row + offset.row * foundReflection.row * level,
        col: block.col + offset.col * foundReflection.col * level
      }
      const b = findBlockByOrigin(blocks, targetBlock.row, targetBlock.col)
      return b
    })
    .filter(x => !!x)

  blocksToMerge.push(block)

  const newBlockOrigin = blocksToMerge.reduce(
    (origin, b) => {
      return {
        row: Math.min(origin.row, b.row),
        col: Math.min(origin.col, b.col)
      }
    },
    {
      row: Number.MAX_VALUE,
      col: Number.MAX_VALUE
    }
  )

  const blockToCreate = {
    row: newBlockOrigin.row,
    col: newBlockOrigin.col,
    level: level + 1,
    id: uuid(),
    color: 'green',
    isDragging: false
  }

  const batch = db.batch()

  blocks
    .filter(b => {
      blocksToMerge.map(bb => bb.id).includes(b.id)
    })
    .map(b => {
      batch.delete(db.collection('blocks').doc(b.id))
    })

  batch.set(db.collection('blocks').doc(blockToCreate.id), blockToCreate)

  return batch.commit()
}

const findBlockByOrigin = (
  blocks: Block[],
  row: number,
  col: number
): Block => {
  const block = blocks.find(b => {
    return b.row === row && b.col === col
  })

  if (!block) {
    throw new Error('cannot get block')
  }
  return block
}

interface Block {
  id: string
  row: number
  col: number
  level: number
}

interface Cell {
  row: number
  col: number
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
