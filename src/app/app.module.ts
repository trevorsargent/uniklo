import { BrowserModule } from '@angular/platform-browser'
import { NgModule } from '@angular/core'

import { AppComponent } from './app.component'
import { BlockComponent } from './components/block/block.component'
import { GameComponent } from './layout/game/game.component'
import { HeaderComponent } from './layout/header/header.component'

@NgModule({
  declarations: [AppComponent, BlockComponent, GameComponent, HeaderComponent],
  imports: [BrowserModule],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
