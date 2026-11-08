import { NgModule } from "@angular/core";
import { ButtonsPage } from "./buttons-page/buttons-page.component";
import { SelectorPageComponent } from "./selector-page/selector-page.component";
import { NotificacionesPage } from "./notificaciones-page/notificaciones-page.component";
import { ListPageComponent } from "./list-page/list-page.component";
import { AnCoreModule, NotFoundPage } from "@aduana/an-core";
import { CommonModule } from "@angular/common";
import { DocumentPageComponent } from "./document-page/document-page.component";
import { TablePageComponent } from "./table-page/table-page.component";
import { FormInputPage } from "./form-input-page/form-input-page.component";
import { UploadDownloadComponent } from "./upload/upload-download.component";

let components: any[] = [
    ButtonsPage,
    ListPageComponent,
    SelectorPageComponent,
    NotificacionesPage,
    DocumentPageComponent,
    TablePageComponent,
    UploadDownloadComponent,
    FormInputPage
    // NotFoundPage
];

@NgModule(
    {
        declarations: components,
        imports: [
            CommonModule,
            AnCoreModule
        ],
        // exports: components
    }
)
export class DemoPageModule {}