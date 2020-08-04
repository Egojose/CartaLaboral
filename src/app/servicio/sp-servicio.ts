import { environment } from 'src/environments/environment';
import { sp } from '@pnp/sp';
import { Injectable } from '@angular/core';
import { from } from 'rxjs';
import { promised } from 'q';

@Injectable()
export class SPServicio {
    constructor() { }

    public ObtenerConfiguracion() {
        const configuracionSharepoint = sp.configure({
            headers: {
                'Accept': 'application/json; odata=verbose'
            }
        }, environment.urlWeb);

        return configuracionSharepoint;
    }

   

    public ObtenerConfiguracionConPost() {
        const configuracionSharepoint = sp.configure({
            headers: {
                'Accept': 'application/json; odata=verbose',
                'Content-Type': 'application/json;odata=verbose',
                'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6ImFQY3R3X29kdlJPb0VOZzNWb09sSWgydGlFcyIsImtpZCI6ImFQY3R3X29kdlJPb0VOZzNWb09sSWgydGlFcyJ9.eyJhdWQiOiIwMDAwMDAwMy0wMDAwLTBmZjEtY2UwMC0wMDAwMDAwMDAwMDAvYXJpYmFzYXMuc2hhcmVwb2ludC5jb21AM2FjZDI5NDUtNDdlOC00YTVjLTljNjgtMjkzOTY5MTA5ZTRkIiwiaXNzIjoiMDAwMDAwMDEtMDAwMC0wMDAwLWMwMDAtMDAwMDAwMDAwMDAwQDNhY2QyOTQ1LTQ3ZTgtNGE1Yy05YzY4LTI5Mzk2OTEwOWU0ZCIsImlhdCI6MTU3MjAxNTk4MCwibmJmIjoxNTcyMDE1OTgwLCJleHAiOjE1NzIwNDUwODAsImlkZW50aXR5cHJvdmlkZXIiOiIwMDAwMDAwMS0wMDAwLTAwMDAtYzAwMC0wMDAwMDAwMDAwMDBAM2FjZDI5NDUtNDdlOC00YTVjLTljNjgtMjkzOTY5MTA5ZTRkIiwibmFtZWlkIjoiNTdjMWUwNjctOWM1My00MjQ4LWE2MmEtZmJhZGI3YWMwODUyQDNhY2QyOTQ1LTQ3ZTgtNGE1Yy05YzY4LTI5Mzk2OTEwOWU0ZCIsIm9pZCI6ImQ4ZWNhM2E3LTBiNTUtNDJhNy1iYTk3LTMxNTJjZjZkZTI0MCIsInN1YiI6ImQ4ZWNhM2E3LTBiNTUtNDJhNy1iYTk3LTMxNTJjZjZkZTI0MCIsInRydXN0ZWRmb3JkZWxlZ2F0aW9uIjoiZmFsc2UifQ.RJz0mJn5T8wD_MFVM41zUB9mhJAgiyiqvP4GeooP6QP-_ahL3pQl8PWamnCmBMrfMRSgOccyGhCKMeUJkue1cBKLIauWF9pRmOA-l3Prz5W4AhZsFsOjBzSbYAIdkiDuKQmQRcSiXxB3I7R-n_cmXtuQDDMVEwe0NIhMIMJq0o9jrG1MOCw4aNgadu1tOeODRH8K8KqhL5dvvOmt2Qcny0slhSKX7ti3pZ1dyEU7gVaG94-i6fD33jf1dq6BvJzGgFmzsIwwg0r4smHPwBlsb0gWJUANNFnGlb8DvS7DO7BVnrkPgrucs7YWJs9W6IfT_QUcIQNjRu3MaCT9xY07SA'
            }
        }, environment.urlWeb);

        return configuracionSharepoint;
    } 

   

    ObtenerUsuarioActual() {
        let respuesta = this.ObtenerConfiguracion().web.currentUser.select('*', 'Author/Department').expand('Author').get();
        return respuesta;
    }

    obtenerUsuario(UsuarioActualId) {
        let respuesta = this.ObtenerConfiguracion().web.lists.getByTitle(environment.ListaEmpleados).items.filter("usuario eq " + UsuarioActualId).select("*", "Empresa/Title", "Empresa/Nit", "Empresa/Director", "Empresa/Cargo", "Empresa/UrlFirma", "Empresa/UrlFormato", "Empresa/UrlLogo").expand("Empresa").getAll();
        return respuesta;
    }

    public consultarConfiguracionCL(){
        let respuesta = this.ObtenerConfiguracion().web.lists.getByTitle("ConfiguracionCartaLaboral").items.get();
        return respuesta;
    }
    

    public obtenerInformacionDetalleNomina(pcedula, pmes, pano) {
        let respuesta = this.ObtenerConfiguracion().web.lists.getByTitle(environment.ListaDetalleNomina).items.filter("CEDULA eq '" + pcedula + "' and MES eq '" + pmes +"' and ANIO eq '" + pano + "'").select("*").getAll();
        return respuesta;
    }

}