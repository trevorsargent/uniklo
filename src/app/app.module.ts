import { BrowserModule } from '@angular/platform-browser'
import { NgModule } from '@angular/core'

import { AppComponent } from './app.component'
import { BlockComponent } from './components/block/block.component'
import { GameComponent } from './layout/game/game.component'
import { HeaderComponent } from './layout/header/header.component'

import { DragDropModule } from '@angular/cdk/drag-drop'
import { AngularResizedEventModule } from 'angular-resize-event'

@NgModule({
  declarations: [AppComponent, BlockComponent, GameComponent, HeaderComponent],
  imports: [BrowserModule, DragDropModule, AngularResizedEventModule],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
