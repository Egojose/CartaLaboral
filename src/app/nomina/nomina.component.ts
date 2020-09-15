import { Component, OnInit } from "@angular/core";
import { Ng4LoadingSpinnerService } from "ng4-loading-spinner";
import { Router, ActivatedRoute, ParamMap } from "@angular/router";
import { SPServicio } from "../servicio/sp-servicio";
import { configCartaLaboral } from "../entidades/configCartaLaboral";
import { Empleado } from "../entidades/empleado";
import { PdfMakeWrapper, Txt, Img, Columns, Table} from "pdfmake-wrapper";
import * as CryptoJS from "crypto-js";
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms'

@Component({
  selector: 'app-nomina',
  templateUrl: './nomina.component.html',
  styleUrls: ['./nomina.component.css']
})
export class NominaComponent implements OnInit {
  form: FormGroup;

  /*Info empleado*/
  empresaEmpleado = "";
  nitEmpresa = "";
  formatoEmpresa = "";
  logoEmpresa = "";

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
  division = "";
  departamento = "";

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
  meses = new Array("ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO",
    "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE");
  mesesCartaLaboral = [];
  usuario: any;
  AnoNomina;
  AnoBuscado;

  SinMeses = false;

  constructor(
    private spinnerService: Ng4LoadingSpinnerService,
    private route: ActivatedRoute,
    private servicio: SPServicio,
    public fb: FormBuilder
  ) { }

  async ngOnInit() {

    await this.ObtenerUsuarioActual();

   
  }

  async ObtenerUsuarioActual() {
    await this.servicio.ObtenerUsuarioActual().then(
      async (respuesta) => {
        this.usuario = respuesta;
        await this.ObtenerEmpleado(this.usuario.Id);
        this.AnoNomina = new Date().getFullYear();
        this.obtenerMesesNomina();

      }, (err) => {
        console.log('Error obteniendo usuario: ' + err);
      }
    )
  }


  async ObtenerEmpleado(id: number) {
    await this.servicio.obtenerUsuario(id).then(
      (respuesta) => {
       
        this.empresaEmpleado = respuesta[0].Empresa.Title;
        this.nitEmpresa = respuesta[0].Empresa.Nit;
        this.formatoEmpresa = respuesta[0].Empresa.UrlFormato;
        this.logoEmpresa = respuesta[0].Empresa.UrlLogo;

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
        this.division = respuesta[0].Division;
        this.departamento = respuesta[0].Departamento;

        this.nombreDirector = respuesta[0].Empresa.Director;
        this.cargoDirector = respuesta[0].Empresa.Cargo;
        this.firmaDirector = respuesta[0].Empresa.UrlFirma;


      }
    )
  }

  async obtenerMesesNomina() { 
    this.mesesCartaLaboral = [];
    let anoActual = new Date().getFullYear();
    let mesActual = new Date().getMonth();
    this.SinMeses = false;
    this.AnoBuscado = this.AnoNomina;

    if (this.AnoNomina == anoActual) {
      for (let index = 0; index < mesActual; index++) {
        this.mesesCartaLaboral.push(this.meses[index]);
      }
     
    }
    else if (this.AnoNomina >= 2019 && this.AnoNomina < anoActual) {
      this.mesesCartaLaboral = this.meses;
    }
    else { 
      this.SinMeses = true;
    }
    
    
  }

;

  async generarCertificado(pmes) {

    let detalleNominaEncontrado = false;
    let conceptos: Conceptos[] = [];
    let totalDevendago = 0;
    let totalDeducido = 0;
    let sueldo = 0;

    try {
      await this.servicio.obtenerInformacionDetalleNomina(this.cedula,this.mesesCartaLaboral[pmes],this.AnoBuscado).then(
        async (respuesta) => {
          if (respuesta.length == 0) {
            alert("No se encontró información del usuario para el mes correspondiente");
            detalleNominaEncontrado = false;

          }
          else {
            detalleNominaEncontrado = true;
            respuesta.forEach(element => {
              if (element.VALORCONCEPTO)
              {
                if (element.TIPOCONCEPTO.toUpperCase().indexOf("DEVENGADO") >= 0) {
                  conceptos.push({
                    Codigo: element.CODIGOCONCEPTO,
                    Concepto: element.CONCEPTO.toUpperCase(),
                    Dias: 30,
                    Devengado: element.VALORCONCEPTO,
                    Deducido: 0
                  }); 
                  if (element.CONCEPTO.toUpperCase().indexOf("SUELDO") >= 0 || element.CONCEPTO.toUpperCase().indexOf("SALARIO") >= 0 ) {
                    this.salario = element.VALORCONCEPTO;
                  }
                  totalDevendago += element.VALORCONCEPTO;
                }
                else if (element.TIPOCONCEPTO.toUpperCase().indexOf("DEDUCIDO") >= 0) { 
                  conceptos.push({
                    Codigo: element.CODIGOCONCEPTO,
                    Concepto: element.CONCEPTO.toUpperCase(),
                    Dias: 30,
                    Devengado: 0,
                    Deducido: element.VALORCONCEPTO
                  });
                  totalDeducido += element.VALORCONCEPTO;

                }
              }
             
            });

            sueldo = totalDevendago + totalDeducido;
            console.log(conceptos);
           
            
          }
        }, (err) => {
          console.log('Error obteniendo usuario: ' + err);
        }
      )
    } catch (error) {
      
    }

    if (detalleNominaEncontrado) {
      let nombre = `${this.primerNombre} ${this.segundoNombre} ${this.primerApellido} ${this.segundoApellido}`;

    
      let fecha = new Date();
      var diaFinMes = new Date(this.AnoBuscado, pmes + 1, 0).getDate();
    
      let stringFecha = this.formatDate(fecha);
      const pdf = new PdfMakeWrapper();


    
    
    

    
    
      pdf.add(
        await new Img(this.logoEmpresa).width(200).margin([20, 0, 0, 0]).build(),
      );
      pdf.add(
        new Txt(this.empresaEmpleado).bold().alignment("center").margin([20, -30, 0, 0]).end
      );
      pdf.add(
        new Txt("NIT: " + this.nitEmpresa).bold().alignment("center").end
      );
      pdf.add(
        new Txt("DESPRENDIBLE DE NÓMINA").bold().alignment("center").end
      );
      pdf.add(
        new Txt("COMPROBANTE DE PAGO DEL de 1 al " + diaFinMes + " de " + this.mesesCartaLaboral[pmes] + " de " + this.AnoBuscado).bold().alignment("center").margin([0, 20, 0, 0]).end
      );
      pdf.add(
        new Txt("Generado: " + stringFecha + " - " + fecha.getHours() + ":" + fecha.getMinutes()).bold().alignment("center").end
      );

      pdf.add(
        new Txt("CÉDULA").bold().margin([20, 20, 0, 0]).end
      );
      pdf.add(
        new Txt("NOMBRE").bold().margin([80, -14, 0, 0]).end
      );
      pdf.add(
        new Txt("CARGO").bold().margin([330, -14, 0, 0]).end
      );
      pdf.add(
        new Txt("SUELDO").bold().margin([700, -14, 0, 0]).end
      );

      pdf.add(
        new Txt(this.cedula).fontSize(10).margin([20, 0, 0, 0]).end
      );
      pdf.add(
        new Txt(nombre).fontSize(10).margin([80, -12, 0, 0]).end
      );
      pdf.add(
        new Txt(this.cargo).fontSize(10).width(50).margin([330, -12, 0, 0]).end
      );
      pdf.add(
        new Txt(this.humanizeNumber(this.salario)).fontSize(10).margin([700, -12, 0, 0]).end
      );

      pdf.add(
        new Txt("____________________________________________________________________________________________________________________________________________________________________").fontSize(10).margin([20, 5, 0, 0]).end
      );

      pdf.add(
        new Txt("División: ").bold().margin([20, 0, 0, 0]).end
      );
      pdf.add(
        new Txt(this.division).fontSize(10).margin([70, -12, 0, 0]).end
      );
      pdf.add(
        new Txt("Departamento: ").bold().margin([330, -14, 0, 0]).end
      );
      pdf.add(
        new Txt(this.departamento).fontSize(10).margin([420, -12, 0, 0]).end
      );
      
   
    
      pdf.add(
        new Table([
          [{
            border: [false, true, false, true],
            fillColor: '#eeeeee',
            text: 'COD',
            alignment: 'center'
          }, {
              border: [false, true, false, true],
              fillColor: '#eeeeee',
              text: 'CONCEPTO',
              alignment: 'center'
            }, {
              border: [false, true, false, true],
              fillColor: '#eeeeee',
              text: 'DIAS/HORAS',
              alignment: 'center'
            }, {
              border: [false, true, false, true],
              fillColor: '#eeeeee',
              text: 'DEVENGADO',
              alignment: 'center'
            }, {
              border: [false, true, false, true],
              fillColor: '#eeeeee',
              text: 'DEDICUDO',
              alignment: 'center'
            }]
        ]).widths([100, '*', 100, 100, 100]).margin([20, 10, 0, 0]).bold().end
      );
     
      conceptos.forEach(element => {
        pdf.add(
          new Table([
            [element.Codigo, element.Concepto,
              
              {
                text: element.Dias,
                alignment: 'center'
              },
              {
                text: this.humanizeNumber(element.Devengado),
                alignment: 'right'
              },
              {
               
                text: this.humanizeNumber(element.Deducido),
                alignment: 'right'
              }
              ]
          ]).widths([100, '*', 100, 100, 100]).margin([20, 0, 0, 0]).layout("lightHorizontalLines").end
        );

       
      });


      
      

      pdf.add(
        new Txt("____________________________________________________________________________________________________________________________________________________________________").fontSize(10).margin([20, 0, 0, 0]).end
      );


       pdf.add(
          new Table([
            [' ',
              {
                text: 'TOTAL PAGADO:',
                alignment: 'right'
              }
              ,
              {
                text: this.humanizeNumber(sueldo),
                alignment: 'right'
              }
              ,
              {
                text: this.humanizeNumber(totalDevendago),
                alignment: 'right'
              }
              ,
              {
                text: this.humanizeNumber(totalDeducido),
                alignment: 'right'
              }]
          ]).widths([100, '*', 100, 100, 100]).bold().margin([20, 0, 0, 0]).layout("lightHorizontalLines").end
        );

      
      

    


      // pdf.add(
      //   new Txt("|").bold().margin([255, 0, 0, 0]).end
      // );
    


      pdf.pageSize("A4");
      pdf.pageMargins([40, 100, 40, 100]);
      pdf.pageOrientation('landscape');
      pdf.create().download('Desprendible_' + this.cedula + "_" + this.AnoBuscado + "_" + this.mesesCartaLaboral[pmes]);
      // setTimeout(() => {
      //   window.close();
      // }, 5000);  
    }
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

  humanizeNumber(n) {
  n = n.toString()
  while (true) {
    var n2 = n.replace(/(\d)(\d{3})($|,|\.)/g, '$1.$2$3')
    n2 = n2
    if (n == n2) break
    n = n2
  }
  return n
}

}

interface Conceptos {
  Codigo: string;
  Concepto: string;
  Dias: number;
  Devengado: number;
  Deducido: number;
}