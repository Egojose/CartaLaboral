import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { Ng4LoadingSpinnerModule } from 'ng4-loading-spinner';
import { CartaLaboralComponent } from './carta-laboral/carta-laboral.component';
import { SPServicio } from './servicio/sp-servicio';
import { PdfViewerModule } from 'ng2-pdf-viewer';


@NgModule({
  declarations: [
    AppComponent,
    CartaLaboralComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    Ng4LoadingSpinnerModule.forRoot(),
    PdfViewerModule
  ],
  providers: [
    SPServicio
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
