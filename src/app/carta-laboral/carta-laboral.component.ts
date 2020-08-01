import { Component, OnInit } from "@angular/core";
import { Ng4LoadingSpinnerService } from "ng4-loading-spinner";
import { Router, ActivatedRoute, ParamMap } from "@angular/router";
import { SPServicio } from "../servicio/sp-servicio";
import { configCartaLaboral } from "../entidades/configCartaLaboral";
import { Empleado } from "../entidades/empleado";
import { PdfMakeWrapper, Txt, Img, Ul } from "pdfmake-wrapper";
import * as CryptoJS from "crypto-js";
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms'

@Component({
  selector: "app-carta-laboral",
  templateUrl: "./carta-laboral.component.html",
  styleUrls: ["./carta-laboral.component.css"]
})
export class CartaLaboralComponent implements OnInit {
  form: FormGroup;

  /*Info empleado*/
  empresaEmpleado = "";
  nitEmpresa = "";
  formatoEmpresa = "";

  primerNombre = "";
  segundoNombre = "";
  primerApellido = "";
  segundoApellido = "";

  tipoDocumento = "";
  cedula = "";
  lugarExpedicion = "";

  fechaIngreso = "";
  tipoContrato = "";

  salario = "";
  salarioTexto = "";
  cargo = "";

  ObjEmpleado: Empleado[];

/*Info empleado*/

  cuerpo = "";
  cuerpoSalario = "";
  cuerpoCargo = "";

  nombreDirector = "";
  cargoDirector = "";
  firmaDirector = "";

  ObjConfigCL: configCartaLaboral[];
  
  pdfSrc: any;
  meses = new Array("Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre");
  
  usuario: any;
  IncluirSalario = false;



  constructor(
    private spinnerService: Ng4LoadingSpinnerService,
    private route: ActivatedRoute,
    private servicio: SPServicio,
    public fb: FormBuilder
  ) { }

  async ngOnInit() {
    await this.ObtenerUsuarioActual();
   
    this.ObtenerConfiguracionCl();
    
  }

  async ObtenerUsuarioActual() {
    await this.servicio.ObtenerUsuarioActual().then(
      async (respuesta) => {
        this.usuario = respuesta;
        await this.ObtenerEmpleado(this.usuario.Id);

      }, (err) => {
        console.log('Error obteniendo usuario: ' + err);
      }
    )
  }

  ObtenerConfiguracionCl() {
    this.servicio.consultarConfiguracionCL().then(
      (respuesta) => {
        
        this.cuerpo = respuesta[0].CuerpoCarta;
        this.cuerpoSalario = respuesta[0].cuerpoSalario;
        this.cuerpoCargo = respuesta[0].CuerpoCargo;

        
        
      }
    )
  }

  async ObtenerEmpleado(id: number) {
    await this.servicio.obtenerUsuario(id).then(
      (respuesta) => {
        console.log(respuesta);
        this.empresaEmpleado = respuesta[0].Empresa.Title;
        this.nitEmpresa = respuesta[0].Empresa.Nit;
        this.formatoEmpresa = respuesta[0].Empresa.UrlFormato;

        this.primerNombre = respuesta[0].PrimerNombre ? respuesta[0].PrimerNombre : "";
        this.segundoNombre = respuesta[0].SegundoNombre ? respuesta[0].SegundoNombre : "";
        this.primerApellido = respuesta[0].PrimerApellido ? respuesta[0].PrimerApellido : "";
        this.segundoApellido = respuesta[0].SegundoApellido ? respuesta[0].SegundoApellido : "";
        
        this.tipoDocumento = respuesta[0].TipoDocumento;
        this.cedula = respuesta[0].NumeroDocumento;
        this.lugarExpedicion = respuesta[0].lugarExpedicion;

        this.fechaIngreso = respuesta[0].FechaIngreso;
        this.tipoContrato = respuesta[0].TipoContrato;

        this.salario = respuesta[0].Salario;
        this.salarioTexto = respuesta[0].salarioTexto;
        this.cargo = respuesta[0].Cargo;

        this.nombreDirector = respuesta[0].Empresa.Director;
        this.cargoDirector = respuesta[0].Empresa.Cargo;
        this.firmaDirector = respuesta[0].Empresa.UrlFirma;


      }
    )
  }

  async generarCertificado() {
   

    let nombre = `${this.primerNombre} ${this.segundoNombre} ${this.primerApellido} ${this.segundoApellido}`;
    
    // let SalarioDecript = CryptoJS.AES.decrypt(
    //   this.salario.trim(),
    //   "12ab".trim()
    // ).toString(CryptoJS.enc.Utf8);
    // let SalarioTextoDecript = CryptoJS.AES.decrypt(
    //   this.salarioTexto.trim(),
    //   "12ab".trim()
    // ).toString(CryptoJS.enc.Utf8);
    let fecha = new Date();
    let dia = fecha.getDate();
    let mes = this.meses[fecha.getMonth()];
    let anio = fecha.getFullYear();
    let diaInicio = new Date(this.fechaIngreso).getDate();
    let mesInicio = this.meses[new Date(this.fechaIngreso).getMonth()];
    let anioInicio = new Date(this.fechaIngreso).getFullYear();
    this.cuerpo = this.cuerpo.replace("{nombre}", nombre);
    this.cuerpo = this.cuerpo.replace("{cedula}", this.cedula);
    this.cuerpo = this.cuerpo.replace("{lugarExpedicion}", this.lugarExpedicion);
    this.cuerpo = this.cuerpo.replace("{fechaIngreso}", this.formatDate(new Date(this.fechaIngreso)) );
    this.cuerpo = this.cuerpo.replace("{tipoContrato}", this.tipoContrato);
    
    this.cuerpoSalario = this.cuerpoSalario.replace("{salarioTexto}", this.salarioTexto);
    this.cuerpoSalario = this.cuerpoSalario.replace("{salario}", this.salario);

    this.cuerpoCargo = this.cuerpoCargo.replace("{cargo}", this.cargo);
    
    let stringFecha = this.formatDate(fecha);
    const pdf = new PdfMakeWrapper();

    pdf.background(
      await new Img(this.formatoEmpresa).width(630).build()
    );
    pdf.add(
      new Txt("Popayán, "+ stringFecha).margin([50, 50, 0, 0]).end
    );
    pdf.add(
      new Txt("EL DIRECTOR EJECUTIVO").bold().margin([190, 40, 0, 0]).end
    );
    
    // pdf.add(
    //   new Txt("|").bold().margin([255, 0, 0, 0]).end
    // );
    let textoEmpresa = "DE " + this.empresaEmpleado;
    let margenDerechaTextoEmpresa = (255 - ((textoEmpresa.length * 0.5))*7.0);
    pdf.add(
      new Txt("DE " + this.empresaEmpleado).bold().margin([margenDerechaTextoEmpresa, 0, 0, 0]).end
    );
    pdf.add(new Txt("CERTIFICA").bold().margin([230, 50, 0, 0]).end);
    
    pdf.add(new Txt(this.cuerpo).margin([50, 50, 0, 0]).end);

    if (this.IncluirSalario)
    {
      pdf.add(new Txt(this.cuerpoSalario).margin([50, 30, 0, 0]).end);
    }
    
    pdf.add(new Txt(this.cuerpoCargo).margin([50, 30, 0, 0]).end);

    pdf.add(new Txt("Este cerificado se expide a petición del interesado.").margin([50, 50, 0, 0]).end);
    
    pdf.add(
      await new Img(this.firmaDirector)
        .margin([50, 50, 0, 0])
        .width(130)
        .build()
    );
    pdf.add(
      new Txt("_____________________________").margin([50, -10, 0, 0]).end
    );
    pdf.add(new Txt(this.nombreDirector).bold().margin([50, 5, 0, 0]).end);
    pdf.add(new Txt(this.cargoDirector).bold().fontSize(7).margin([50, 0, 0, 0]).end);
    

    
     pdf.pageSize("A4");
    pdf.pageMargins([40, 100, 40, 100]);
    pdf.create().open();
    // setTimeout(() => {
    //   window.close();
    // }, 5000);  
  }



  formatDate(date) {
    var d = date,
      month = "" + this.meses[d.getMonth()],
      // month = "" + (d.getMonth() + 1),
      day = "" + d.getDate(),
      year = d.getFullYear();

    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;

    return [day, month, year].join(" ");
  }


}
