import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-block',
  templateUrl: './block.component.html',
  styleUrls: ['./block.component.css']
})
export class BlockComponent implements OnInit {

  @Input()
  block: Block;

  @Input()
  gridSize: number;

  @Input()
  gutter: number;

  get cellPercent() {
    return (100 - ((this.gridSize + 1) * this.gutter)) / this.gridSize;
  }

  get left() {
    return this.block.col * this.cellPercent + (this.block.col + 1) * this.gutter;
  }

  get top() {
    return this.block.row * this.cellPercent + (this.block.row + 1) * this.gutter;
  }

  get size() {
    return this.block.size * this.cellPercent + (this.block.size - 1) * this.gutter;
  }

  constructor() { }

  ngOnInit(): void {
  }



}

export interface Block {
  row: number;
  col: number;
  size: number;
  color: string;
}
