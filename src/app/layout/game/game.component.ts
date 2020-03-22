import { Component, OnInit, ElementRef, OnDestroy } from '@angular/core'
import { Block } from 'src/app/components/block/block.component'
import { SizeObserverService, SizeObserver } from '@service-work/size-observer'
import { ResizedEvent } from 'angular-resize-event'

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit, OnDestroy {
  constructor(private el: ElementRef) {}

  private sizeObserver: SizeObserver

  GRID_SIZE = 10
  GUTTER = 1
  GAME_SIZE

  blocks: Block[]

  ngOnInit(): void {
    this.blocks = [
      { col: 0, row: 0, color: '#b20000', size: 1, id: '1' },
      { col: 3, row: 4, color: '#b20000', size: 2, id: '2' },
      { col: 0, row: 2, color: '#b20000', size: 1, id: '3' },
      { col: 0, row: 3, color: '#b20000', size: 1, id: '4' },
      { col: 0, row: 4, color: '#b20000', size: 1, id: '5' }
    ]
  }

  onResize($event: ResizedEvent) {
    this.GAME_SIZE = $event.newWidth
  }

  onBlockMove($event: Block) {
    const block = this.blocks.find(b => b.id === $event.id)
    block.row = $event.row
    block.col = $event.col
  }

  ngOnDestroy() {
    // Remember to mark the `SizeObserver` as complete `OnDestroy`
    this.sizeObserver.complete()
  }
}
