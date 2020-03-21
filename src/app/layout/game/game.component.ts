import { Component, OnInit } from '@angular/core'
import { Block } from 'src/app/components/block/block.component'

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit {
  constructor() {}

  GRID_SIZE = 24
  GUTTER = 1.5

  blocks: Block[]

  ngOnInit(): void {
    this.blocks = [
      { col: 0, row: 6, color: '#b20000', size: 2 },
      { col: 8, row: 2, color: '#b20000', size: 4 },
      { col: 2, row: 0, color: '#b20000', size: 2 }
    ]
  }
}
