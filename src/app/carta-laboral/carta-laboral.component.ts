import { Component, OnInit } from "@angular/core";
import { Ng4LoadingSpinnerService } from "ng4-loading-spinner";
import { Router, ActivatedRoute, ParamMap } from "@angular/router";
import { SPServicio } from "../servicio/sp-servicio";
import { configCartaLaboral } from "../entidades/configCartaLaboral";
import { Empleado } from "../entidades/empleado";
import { PdfMakeWrapper, Txt, Img, Ul } from "pdfmake-wrapper";
import * as CryptoJS from "crypto-js";

@Component({
  selector: "app-carta-laboral",
  templateUrl: "./carta-laboral.component.html",
  styleUrls: ["./carta-laboral.component.css"]
})
export class CartaLaboralComponent implements OnInit {
  ObjConfigCL: configCartaLaboral[];
  ObjEmpleado: Empleado[];
  pdfSrc: any;
  meses = new Array ("Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre");

  constructor(
    private spinnerService: Ng4LoadingSpinnerService,
    private route: ActivatedRoute,
    private servicio: SPServicio
  ) {}

  ngOnInit(): void {
    this.spinnerService.show();
    let id = this.route.snapshot.paramMap.get("id");
    let salario = this.route.snapshot.paramMap.get("salario");
    let funciones = this.route.snapshot.paramMap.get("funciones");
    let dirigidoA = this.route.snapshot.paramMap.get("dirigidoA");
    this.ObtenerConfiguracionCL(id, salario, funciones, dirigidoA);
  }

  ObtenerConfiguracionCL(id, salario, funciones, dirigidoA): any {
    this.servicio
      .consultarConfiguracionCL()
      .then(res => {
        this.ObjConfigCL = configCartaLaboral.fromJsonList(res);
        this.ObtenerEmpleado(
          id,
          salario,
          funciones,
          dirigidoA,
          this.ObjConfigCL[0]
        );
      })
      .catch(error => {
        console.log(error);
      });
  }

  formatDate(date) {
    var d = date,
      month = "" + this.meses[d.getMonth()],
      // month = "" + (d.getMonth() + 1),
      day = "" + d.getDate(),
      year = d.getFullYear();

    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;

    return [year, month, day].join("-");
  }

  ObtenerEmpleado(
    id: string,
    salario: string,
    funciones: string,
    dirigidoA,
    ObjConfigCL: configCartaLaboral
  ): any {
    this.servicio
      .obtenerUsuario(id)
      .then(async res => {
        this.ObjEmpleado = Empleado.fromJsonList(res);
        if (salario === "true") {
          this.CrearCartaConSalario(
            salario,
            funciones,
            dirigidoA,
            ObjConfigCL,
            this.ObjEmpleado[0]
          );
        } else {
          this.CrearCartaSinSalario(
            salario,
            funciones,
            dirigidoA,
            ObjConfigCL,
            this.ObjEmpleado[0]
          );
        }
      })
      .catch(error => {
        console.log(error);
      });
  }

  async CrearCartaSinSalario(
    salario: string,
    funciones: string,
    dirigidoA: any,
    ObjConfigCL: configCartaLaboral,
    ObjEmpleado: Empleado
  ): Promise<any> {

    if (funciones === "true") {
      this.crearCartaConFunciones(salario, funciones, dirigidoA, ObjConfigCL, ObjEmpleado);      
    } else {
      this.crearCartaSinFunciones(salario, funciones, dirigidoA, ObjConfigCL, ObjEmpleado);
    }    
  }

  async crearCartaConFunciones(salario: string, funciones: string, dirigidoA: any, ObjConfigCL: configCartaLaboral, ObjEmpleado: Empleado): Promise<any> {
    let fecha = new Date();
    let stringFecha = this.formatDate(fecha);

    // let ObjEmpleado = this.ObjEmpleado[0];
    let nombre =
      ObjEmpleado.nombre2 === ""
        ? ObjEmpleado.nombre1
        : ObjEmpleado.nombre1 + " " + ObjEmpleado.nombre2;
    let apellido =
      ObjEmpleado.apellido2 === ""
        ? ObjEmpleado.apellido1
        : ObjEmpleado.apellido1 + " " + ObjEmpleado.apellido2;
    let nombreCompleto = nombre + " " + apellido;
    let cuerpoCarta = ObjConfigCL.CuerpoSinSalario;
    cuerpoCarta = cuerpoCarta.replace("{nombre}", nombreCompleto);
    cuerpoCarta = cuerpoCarta.replace("{cedula}", ObjEmpleado.numeroDocumento);
    cuerpoCarta = cuerpoCarta.replace(
      "{nombreEmpresa}",
      ObjConfigCL.nombreEmpresa
    );
    cuerpoCarta = cuerpoCarta.replace(
      "{terminoContrato}",
      ObjEmpleado.terminoContrato
    );
    let fechaInicio = ObjEmpleado.fechaIngreso;
    let dia = fechaInicio.getDate();
    cuerpoCarta = cuerpoCarta.replace("{dia}", dia.toString());
    // let mes = "" + (fechaInicio.getMonth() + 1);
    let mes = this.meses[fecha.getMonth()];    
    cuerpoCarta = cuerpoCarta.replace("{mes}", mes.toString());
    let ano = fechaInicio.getFullYear();
    cuerpoCarta = cuerpoCarta.replace("{ano}", ano.toString());
    cuerpoCarta = cuerpoCarta.replace("{cargo}", ObjEmpleado.cargo);
    const pdf = new PdfMakeWrapper();
    pdf.background(
      await new Img("../assets/imagenes/encabezado.jpg").width(630).build()
    );
    pdf.add(
      new Txt(ObjEmpleado.sede + ", " + stringFecha).margin([50, 80, 0, 0]).end
    );
    pdf.add(
      new Txt(ObjConfigCL.nombreEmpresa).bold().margin([100, 70, 0, 0]).end
    );
    pdf.add(
      new Txt("NIT "+ObjConfigCL.nitEmpresa).bold().margin([200, 0, 0, 0]).end
    );
    pdf.add(new Txt("CERTIFICA").margin([230, 70, 0, 0]).end);
    pdf.add(new Txt(cuerpoCarta).margin([50, 80, 0, 0]).end);

    let objFunctiones = [];
    objFunctiones = ObjEmpleado.funciones !== null && ObjEmpleado.funciones !== undefined ? ObjEmpleado.funciones.split(";"): [];
    pdf.add(new Ul(objFunctiones).margin([50, 20, 0, 0]).end);

    let notaExpedicion = ObjConfigCL.NotaExpedicion;
    notaExpedicion = notaExpedicion.replace("{dirigidoA}", dirigidoA);
    dia = fecha.getDate();
    notaExpedicion = notaExpedicion.replace("{dia}", dia.toString());
    mes = this.meses[fecha.getMonth()]; 
    notaExpedicion = notaExpedicion.replace("{mes}", mes.toString());
    ano = fecha.getFullYear();
    notaExpedicion = notaExpedicion.replace("{ano}", ano.toString());
    pdf.add(new Txt(notaExpedicion).margin([50, 10, 0, 0]).end);
    pdf.add(new Txt("Cordialmente,").margin([50, 10, 0, 0]).end);
    pdf.add(
      await new Img(ObjConfigCL.imagenFirmaDir)
        .margin([50, 0, 0, 0])
        .width(130)
        .build()
    );
    pdf.add(
      new Txt("_____________________________").margin([50, -30, 0, 0]).end
    );
    pdf.add(new Txt(ObjConfigCL.nombreDirectorRH).margin([50, 0, 0, 0]).end);
    pdf.add(new Txt(ObjConfigCL.nombreCargoDir).fontSize(7).margin([50, 0, 0, 0]).end);
    pdf.pageSize("A4");
    pdf.pageMargins([ 40, 100, 40, 100 ]);
    pdf.create().open();
    setTimeout(() => {
      sessionStorage.clear();
      window.close();
    }, 5000);
    
  }


  async crearCartaSinFunciones(salario: string, funciones: string, dirigidoA: any, ObjConfigCL: configCartaLaboral, ObjEmpleado: Empleado): Promise<any> {
    let fecha = new Date();
    let stringFecha = this.formatDate(fecha);

    // let ObjEmpleado = this.ObjEmpleado[0];
    let nombre =
      ObjEmpleado.nombre2 === ""
        ? ObjEmpleado.nombre1
        : ObjEmpleado.nombre1 + " " + ObjEmpleado.nombre2;
    let apellido =
      ObjEmpleado.apellido2 === ""
        ? ObjEmpleado.apellido1
        : ObjEmpleado.apellido1 + " " + ObjEmpleado.apellido2;
    let nombreCompleto = nombre + " " + apellido;
    let cuerpoCarta = ObjConfigCL.CuerpoSinSalario;
    cuerpoCarta = cuerpoCarta.replace("{nombre}", nombreCompleto);
    cuerpoCarta = cuerpoCarta.replace("{cedula}", ObjEmpleado.numeroDocumento);
    cuerpoCarta = cuerpoCarta.replace(
      "{nombreEmpresa}",
      ObjConfigCL.nombreEmpresa
    );
    cuerpoCarta = cuerpoCarta.replace(
      "{terminoContrato}",
      ObjEmpleado.terminoContrato
    );
    let fechaInicio = ObjEmpleado.fechaIngreso;
    let dia = fechaInicio.getDate();
    cuerpoCarta = cuerpoCarta.replace("{dia}", dia.toString());
    // let mes = "" + (fechaInicio.getMonth() + 1);
    let mes = this.meses[fechaInicio.getMonth()];
    cuerpoCarta = cuerpoCarta.replace("{mes}", mes.toString());
    let ano = fechaInicio.getFullYear();
    cuerpoCarta = cuerpoCarta.replace("{ano}", ano.toString());
    cuerpoCarta = cuerpoCarta.replace("{cargo}", ObjEmpleado.cargo);
    const pdf = new PdfMakeWrapper();
    pdf.background(
      await new Img("../assets/imagenes/encabezado.jpg").width(630).build()
    );
    pdf.add(
      new Txt(ObjEmpleado.sede + ", " + stringFecha).margin([50, 80, 0, 0]).end
    );
    pdf.add(
      new Txt(ObjConfigCL.nombreEmpresa).bold().margin([100, 70, 0, 0]).end
    );
    pdf.add(
      new Txt("NIT "+ObjConfigCL.nitEmpresa).bold().margin([200, 0, 0, 0]).end
    );
    pdf.add(new Txt("CERTIFICA").margin([230, 70, 0, 0]).end);
    pdf.add(new Txt(cuerpoCarta).margin([50, 80, 0, 0]).end);
    let notaExpedicion = ObjConfigCL.NotaExpedicion;
    notaExpedicion = notaExpedicion.replace("{dirigidoA}", dirigidoA);
    dia = fecha.getDate();
    notaExpedicion = notaExpedicion.replace("{dia}", dia.toString());
    mes = this.meses[fecha.getMonth()]; 
    notaExpedicion = notaExpedicion.replace("{mes}", mes.toString());
    ano = fecha.getFullYear();
    notaExpedicion = notaExpedicion.replace("{ano}", ano.toString());
    pdf.add(new Txt(notaExpedicion).margin([50, 80, 0, 0]).end);
    pdf.add(new Txt("Cordialmente,").margin([50, 30, 0, 0]).end);
    pdf.add(
      await new Img(ObjConfigCL.imagenFirmaDir)
        .margin([50, 0, 0, 0])
        .width(130)
        .build()
    );
    pdf.add(
      new Txt("_____________________________").margin([50, -30, 0, 0]).end
    );
    pdf.add(new Txt(ObjConfigCL.nombreDirectorRH).margin([50, 0, 0, 0]).end);
    pdf.add(new Txt(ObjConfigCL.nombreCargoDir).fontSize(7).margin([50, 0, 0, 0]).end);
    pdf.pageSize("A4");
    pdf.pageMargins([ 40, 100, 40, 100 ]);
    pdf.create().open();
    setTimeout(() => {
      sessionStorage.clear();
      window.close();
    }, 5000);
  }

  async CrearCartaConSalario(
    salario: string,
    funciones: string,
    dirigidoA: any,
    ObjConfigCL: configCartaLaboral,
    ObjEmpleado: Empleado
  ): Promise<any> {
    if (ObjEmpleado.tipoContrato === "Integral") {
      this.crearCartaSalarioInt(salario, funciones, dirigidoA, ObjConfigCL, ObjEmpleado);
    } else {
      this.crearCartaSalarioOrd(salario, funciones, dirigidoA, ObjConfigCL, ObjEmpleado);
    }
  }
  async crearCartaSalarioOrd(
    salario: string, funciones: string,dirigidoA: any, 
    ObjConfigCL: configCartaLaboral, ObjEmpleado: Empleado
  ): Promise<any> {

    if (funciones === "true") {
      this.crearCartaSalarioOrdConFun(salario, funciones, dirigidoA, ObjConfigCL, ObjEmpleado);
    }
    else {
      this.crearCartaSalarioOrdSinFun(salario, funciones, dirigidoA, ObjConfigCL, ObjEmpleado);
    }     
  }
  async crearCartaSalarioOrdSinFun(salario: string, funciones: string, dirigidoA: any, ObjConfigCL: configCartaLaboral, ObjEmpleado: Empleado): Promise<any> {
    let fecha = new Date();
    let stringFecha = this.formatDate(fecha);

    // let ObjEmpleado = this.ObjEmpleado[0];
    let nombre =
      ObjEmpleado.nombre2 === ""
        ? ObjEmpleado.nombre1
        : `${ObjEmpleado.nombre1} ${ObjEmpleado.nombre2}`;
    let apellido =
      ObjEmpleado.apellido2 === ""
        ? ObjEmpleado.apellido1
        : `${ObjEmpleado.apellido1} ${ObjEmpleado.apellido2}`;
        let nombreCompleto = `${nombre} ${apellido}`
    // let nombreCompleto = nombre + " " + apellido;
    let cuerpoCarta = ObjConfigCL.CuerpoConSalario;
    cuerpoCarta = cuerpoCarta.replace("{nombre}", nombreCompleto);
    cuerpoCarta = cuerpoCarta.replace("{cedula}", ObjEmpleado.numeroDocumento);
    cuerpoCarta = cuerpoCarta.replace(
      "{nombreEmpresa}",
      ObjConfigCL.nombreEmpresa
    );
    cuerpoCarta = cuerpoCarta.replace(
      "{terminoContrato}",
      ObjEmpleado.terminoContrato
    );
    let fechaInicio = ObjEmpleado.fechaIngreso;
    let dia = fechaInicio.getDate();
    cuerpoCarta = cuerpoCarta.replace("{dia}", dia.toString());
    // let mes = "" + (fechaInicio.getMonth() + 1);
    let mes = this.meses[fechaInicio.getMonth()];
    cuerpoCarta = cuerpoCarta.replace("{mes}", mes.toString());
    let ano = fechaInicio.getFullYear();
    cuerpoCarta = cuerpoCarta.replace("{ano}", ano.toString());
    cuerpoCarta = cuerpoCarta.replace("{cargo}", ObjEmpleado.cargo);
    let SalarioTextoDecript = CryptoJS.AES.decrypt(
      ObjEmpleado.salarioTexto.trim(),
      "12ab".trim()
    ).toString(CryptoJS.enc.Utf8);
    cuerpoCarta = cuerpoCarta.replace("{salarioTexto}", SalarioTextoDecript);
    let SalarioDecript = CryptoJS.AES.decrypt(
      ObjEmpleado.salario.trim(),
      "12ab".trim()
    ).toString(CryptoJS.enc.Utf8);
    cuerpoCarta = cuerpoCarta.replace("{salario}", SalarioDecript);
    const pdf = new PdfMakeWrapper();
    pdf.background(
      await new Img("../assets/imagenes/encabezado.jpg").width(630).build()
    );
    pdf.add(
      new Txt(ObjEmpleado.sede + ", " + stringFecha).margin([50, 50, 0, 0]).end
    );
    pdf.add(
      new Txt(ObjConfigCL.nombreEmpresa).bold().margin([100, 50, 0, 0]).end
    );
    pdf.add(
      new Txt("NIT "+ObjConfigCL.nitEmpresa).bold().margin([200, 0, 0, 0]).end
    );
    pdf.add(new Txt("CERTIFICA").margin([230, 50, 0, 0]).end);
    pdf.add(new Txt(cuerpoCarta).margin([50, 50, 0, 0]).end);
    let notaExpedicion = ObjConfigCL.NotaExpedicion;
    notaExpedicion = notaExpedicion.replace("{dirigidoA}", dirigidoA);
    dia = fecha.getDate();
    notaExpedicion = notaExpedicion.replace("{dia}", dia.toString());
    mes = this.meses[fecha.getMonth()]; 
    notaExpedicion = notaExpedicion.replace("{mes}", mes.toString());
    ano = fecha.getFullYear();
    notaExpedicion = notaExpedicion.replace("{ano}", ano.toString());
    pdf.add(new Txt(notaExpedicion).margin([50, 80, 0, 0]).end);
    pdf.add(new Txt("Cordialmente,").margin([50, 30, 0, 0]).end);
    pdf.add(
      await new Img(ObjConfigCL.imagenFirmaDir)
        .margin([50, 0, 0, 0])
        .width(130)
        .build()
    );
    pdf.add(
      new Txt("_____________________________").margin([50, -30, 0, 0]).end
    );
    pdf.add(new Txt(ObjConfigCL.nombreDirectorRH).margin([50, 0, 0, 0]).end);
    pdf.add(new Txt(ObjConfigCL.nombreCargoDir).fontSize(7).margin([50, 0, 0, 0]).end);
    pdf.pageSize("A4");
    pdf.pageMargins([ 40, 100, 40, 100 ]);
    pdf.create().open();
    setTimeout(() => {
      sessionStorage.clear();
      window.close();
    }, 5000);
  }
  async crearCartaSalarioOrdConFun(salario: string, funciones: string, dirigidoA: any, ObjConfigCL: configCartaLaboral, ObjEmpleado: Empleado): Promise<any> {
    let fecha = new Date();
    let stringFecha = this.formatDate(fecha);

    // let ObjEmpleado = this.ObjEmpleado[0];
    let nombre =
      ObjEmpleado.nombre2 === ""
        ? ObjEmpleado.nombre1
        : ObjEmpleado.nombre1 + " " + ObjEmpleado.nombre2;
    let apellido =
      ObjEmpleado.apellido2 === ""
        ? ObjEmpleado.apellido1
        : ObjEmpleado.apellido1 + " " + ObjEmpleado.apellido2;
    let nombreCompleto = nombre + " " + apellido;
    let cuerpoCarta = ObjConfigCL.CuerpoConSalario;
    cuerpoCarta = cuerpoCarta.replace("{nombre}", nombreCompleto);
    cuerpoCarta = cuerpoCarta.replace("{cedula}", ObjEmpleado.numeroDocumento);
    cuerpoCarta = cuerpoCarta.replace(
      "{nombreEmpresa}",
      ObjConfigCL.nombreEmpresa
    );
    cuerpoCarta = cuerpoCarta.replace(
      "{terminoContrato}",
      ObjEmpleado.terminoContrato
    );
    let fechaInicio = ObjEmpleado.fechaIngreso;
    let dia = fechaInicio.getDate();
    cuerpoCarta = cuerpoCarta.replace("{dia}", dia.toString());
    // let mes = "" + (fechaInicio.getMonth() + 1);
    let mes = this.meses[fechaInicio.getMonth()];
    cuerpoCarta = cuerpoCarta.replace("{mes}", mes.toString());
    let ano = fechaInicio.getFullYear();
    cuerpoCarta = cuerpoCarta.replace("{ano}", ano.toString());
    cuerpoCarta = cuerpoCarta.replace("{cargo}", ObjEmpleado.cargo);
    let SalarioTextoDecript = CryptoJS.AES.decrypt(
      ObjEmpleado.salarioTexto.trim(),
      "12ab".trim()
    ).toString(CryptoJS.enc.Utf8);
    cuerpoCarta = cuerpoCarta.replace("{salarioTexto}", SalarioTextoDecript);
    let SalarioDecript = CryptoJS.AES.decrypt(
      ObjEmpleado.salario.trim(),
      "12ab".trim()
    ).toString(CryptoJS.enc.Utf8);
    cuerpoCarta = cuerpoCarta.replace("{salario}", SalarioDecript);
    const pdf = new PdfMakeWrapper();
    pdf.background(
      await new Img("../assets/imagenes/encabezado.jpg").width(630).build()
    );
    pdf.add(
      new Txt(`${ObjEmpleado.sede}, ${stringFecha}`).margin([50, 80, 0, 0]).end
    );
    pdf.add(
      new Txt(ObjConfigCL.nombreEmpresa).bold().margin([100, 70, 0, 0]).end
    );
    pdf.add(
      new Txt("NIT "+ObjConfigCL.nitEmpresa).bold().margin([200, 0, 0, 0]).end
    );
    pdf.add(new Txt("CERTIFICA").margin([230, 70, 0, 0]).end);
    pdf.add(new Txt(cuerpoCarta).margin([50, 80, 0, 0]).end);

    let objFunctiones = [];
    objFunctiones = ObjEmpleado.funciones !== null && ObjEmpleado.funciones !== undefined ? ObjEmpleado.funciones.split(";"): [];
    pdf.add(new Ul(objFunctiones).margin([50, 20, 0, 0]).end);

    let notaExpedicion = ObjConfigCL.NotaExpedicion;
    notaExpedicion = notaExpedicion.replace("{dirigidoA}", dirigidoA);
    dia = fecha.getDate();
    notaExpedicion = notaExpedicion.replace("{dia}", dia.toString());
    mes = this.meses[fecha.getMonth()]; 
    notaExpedicion = notaExpedicion.replace("{mes}", mes.toString());
    ano = fecha.getFullYear();
    notaExpedicion = notaExpedicion.replace("{ano}", ano.toString());
    pdf.add(new Txt(notaExpedicion).margin([50, 10, 0, 0]).end);
    pdf.add(new Txt("Cordialmente,").margin([50, 10, 0, 0]).end);
    pdf.add(
      await new Img(ObjConfigCL.imagenFirmaDir)
        .margin([50, 0, 0, 0])
        .width(130)
        .build()
    );
    pdf.add(
      new Txt("_____________________________").margin([50, -30, 0, 0]).end
    );
    pdf.add(new Txt(ObjConfigCL.nombreDirectorRH).margin([50, 0, 0, 0]).end);
    pdf.add(new Txt(ObjConfigCL.nombreCargoDir).fontSize(7).margin([50, 0, 0, 0]).end);
    pdf.pageSize("A4");
    pdf.pageMargins([ 40, 100, 40, 100 ]);
    pdf.create().open();
    setTimeout(() => {
      sessionStorage.clear();
      window.close();
    }, 5000);
  }

  async crearCartaSalarioInt(
    salario: string,
    funciones: string,
    dirigidoA: any,
    ObjConfigCL: configCartaLaboral,
    ObjEmpleado: Empleado
  ): Promise<any> {

    if (funciones === "true") {
      this.crearCartaSalarioIntConFun(salario, funciones, dirigidoA, ObjConfigCL, ObjEmpleado);
    }
    else {
      this.crearCartaSalarioIntSinFun(salario, funciones, dirigidoA, ObjConfigCL, ObjEmpleado);
    }    
  }

  async crearCartaSalarioIntSinFun( salario: string,
    funciones: string,
    dirigidoA: any,
    ObjConfigCL: configCartaLaboral,
    ObjEmpleado: Empleado): Promise<any> {
    let fecha = new Date();
    let stringFecha = this.formatDate(fecha);

    // let ObjEmpleado = this.ObjEmpleado[0];
    let nombre =
      ObjEmpleado.nombre2 === ""
        ? ObjEmpleado.nombre1
        : ObjEmpleado.nombre1 + " " + ObjEmpleado.nombre2;
    let apellido =
      ObjEmpleado.apellido2 === ""
        ? ObjEmpleado.apellido1
        : ObjEmpleado.apellido1 + " " + ObjEmpleado.apellido2;
    let nombreCompleto = nombre + " " + apellido;
    let cuerpoCarta = ObjConfigCL.CuerpoIntegral;
    cuerpoCarta = cuerpoCarta.replace("{nombre}", nombreCompleto);
    cuerpoCarta = cuerpoCarta.replace("{cedula}", ObjEmpleado.numeroDocumento);
    cuerpoCarta = cuerpoCarta.replace(
      "{nombreEmpresa}",
      ObjConfigCL.nombreEmpresa
    );
    cuerpoCarta = cuerpoCarta.replace(
      "{terminoContrato}",
      ObjEmpleado.terminoContrato
    );
    let fechaInicio = ObjEmpleado.fechaIngreso;
    let dia = fechaInicio.getDate();
    cuerpoCarta = cuerpoCarta.replace("{dia}", dia.toString());
    // let mes = "" + (fechaInicio.getMonth() + 1);
    let mes = this.meses[fechaInicio.getMonth()];
    cuerpoCarta = cuerpoCarta.replace("{mes}", mes.toString());
    let ano = fechaInicio.getFullYear();
    cuerpoCarta = cuerpoCarta.replace("{ano}", ano.toString());
    cuerpoCarta = cuerpoCarta.replace("{cargo}", ObjEmpleado.cargo);
    let SalarioTextoDecript = CryptoJS.AES.decrypt(
      ObjEmpleado.salarioTexto.trim(),
      "12ab".trim()
    ).toString(CryptoJS.enc.Utf8);
    cuerpoCarta = cuerpoCarta.replace("{salarioTexto}", SalarioTextoDecript);
    let SalarioDecript = CryptoJS.AES.decrypt(
      ObjEmpleado.salario.trim(),
      "12ab".trim()
    ).toString(CryptoJS.enc.Utf8);
    cuerpoCarta = cuerpoCarta.replace("{salario}", SalarioDecript);
    const pdf = new PdfMakeWrapper();
    pdf.background(
      await new Img("../assets/imagenes/encabezado.jpg").width(630).build()
    );
    pdf.add(
      new Txt(ObjEmpleado.sede + ", " + stringFecha).margin([50, 80, 0, 0]).end
    );
    pdf.add(
      new Txt(ObjConfigCL.nombreEmpresa).bold().margin([100, 70, 0, 0]).end
    );
    pdf.add(
      new Txt("NIT "+ObjConfigCL.nitEmpresa).bold().margin([200, 0, 0, 0]).end
    );
    pdf.add(new Txt("CERTIFICA").margin([230, 70, 0, 0]).end);
    pdf.add(new Txt(cuerpoCarta).margin([50, 40, 0, 0]).end);

    
    let notaExpedicion = ObjConfigCL.NotaExpedicion;
    notaExpedicion = notaExpedicion.replace("{dirigidoA}", dirigidoA);
    dia = fecha.getDate();
    notaExpedicion = notaExpedicion.replace("{dia}", dia.toString());
    mes = this.meses[fecha.getMonth()]; 
    notaExpedicion = notaExpedicion.replace("{mes}", mes.toString());
    ano = fecha.getFullYear();
    notaExpedicion = notaExpedicion.replace("{ano}", ano.toString());
    pdf.add(new Txt(notaExpedicion).margin([50, 80, 0, 0]).end);
    pdf.add(new Txt("Cordialmente,").margin([50, 30, 0, 0]).end);
    pdf.add(
      await new Img(ObjConfigCL.imagenFirmaDir)
        .margin([50, 0, 0, 0])
        .width(130)
        .build()
    );
    pdf.add(
      new Txt("_____________________________").margin([50, -30, 0, 0]).end
    );
    pdf.add(new Txt(ObjConfigCL.nombreDirectorRH).margin([50, 0, 0, 0]).end);
    pdf.add(new Txt(ObjConfigCL.nombreCargoDir).fontSize(7).margin([50, 0, 0, 0]).end);
    pdf.pageSize("A4");
    pdf.pageMargins([ 40, 100, 40, 100 ]);
    pdf.create().open();
    setTimeout(() => {
      sessionStorage.clear();
      window.close();
    }, 5000);
  }

  async crearCartaSalarioIntConFun( salario: string,
    funciones: string,
    dirigidoA: any,
    ObjConfigCL: configCartaLaboral,
    ObjEmpleado: Empleado): Promise<any> {
    let fecha = new Date();
    let stringFecha = this.formatDate(fecha);

    // let ObjEmpleado = this.ObjEmpleado[0];
    let nombre =
      ObjEmpleado.nombre2 === ""
        ? ObjEmpleado.nombre1
        : ObjEmpleado.nombre1 + " " + ObjEmpleado.nombre2;
    let apellido =
      ObjEmpleado.apellido2 === ""
        ? ObjEmpleado.apellido1
        : ObjEmpleado.apellido1 + " " + ObjEmpleado.apellido2;
    let nombreCompleto = nombre + " " + apellido;
    let cuerpoCarta = ObjConfigCL.CuerpoIntegral;
    cuerpoCarta = cuerpoCarta.replace("{nombre}", nombreCompleto);
    cuerpoCarta = cuerpoCarta.replace("{cedula}", ObjEmpleado.numeroDocumento);
    cuerpoCarta = cuerpoCarta.replace(
      "{nombreEmpresa}",
      ObjConfigCL.nombreEmpresa
    );
    cuerpoCarta = cuerpoCarta.replace(
      "{terminoContrato}",
      ObjEmpleado.terminoContrato
    );
    let fechaInicio = ObjEmpleado.fechaIngreso;
    let dia = fechaInicio.getDate();
    cuerpoCarta = cuerpoCarta.replace("{dia}", dia.toString());
    // let mes = "" + (fechaInicio.getMonth() + 1);
    let mes = this.meses[fechaInicio.getMonth()];
    cuerpoCarta = cuerpoCarta.replace("{mes}", mes.toString());
    let ano = fechaInicio.getFullYear();
    cuerpoCarta = cuerpoCarta.replace("{ano}", ano.toString());
    cuerpoCarta = cuerpoCarta.replace("{cargo}", ObjEmpleado.cargo);
    let SalarioTextoDecript = CryptoJS.AES.decrypt(
      ObjEmpleado.salarioTexto.trim(),
      "12ab".trim()
    ).toString(CryptoJS.enc.Utf8);
    cuerpoCarta = cuerpoCarta.replace("{salarioTexto}", SalarioTextoDecript);
    let SalarioDecript = CryptoJS.AES.decrypt(
      ObjEmpleado.salario.trim(),
      "12ab".trim()
    ).toString(CryptoJS.enc.Utf8);
    cuerpoCarta = cuerpoCarta.replace("{salario}", SalarioDecript);
    const pdf = new PdfMakeWrapper();
    pdf.background(
      await new Img("../assets/imagenes/encabezado.jpg").width(630).build()
    );
    pdf.add(
      new Txt(ObjEmpleado.sede + ", " + stringFecha).margin([50, 80, 0, 0]).end
    );
    pdf.add(
      new Txt(ObjConfigCL.nombreEmpresa).bold().margin([100, 70, 0, 0]).end
    );
    pdf.add(
      new Txt("NIT "+ObjConfigCL.nitEmpresa).bold().margin([200, 0, 0, 0]).end
    );
    pdf.add(new Txt("CERTIFICA").margin([230, 70, 0, 0]).end);
    pdf.add(new Txt(cuerpoCarta).margin([50, 40, 0, 0]).end);

    pdf.add(new Txt(ObjConfigCL.CuerpoFunciones).margin([50, 20, 0, 0]).end);

    let objFunctiones = [];
    objFunctiones = ObjEmpleado.funciones !== null && ObjEmpleado.funciones !== undefined ? ObjEmpleado.funciones.split(";"): [];
    pdf.add(new Ul(objFunctiones).margin([50, 20, 0, 0]).end);
    
    let notaExpedicion = ObjConfigCL.NotaExpedicion;
    notaExpedicion = notaExpedicion.replace("{dirigidoA}", dirigidoA);
    dia = fecha.getDate();
    notaExpedicion = notaExpedicion.replace("{dia}", dia.toString());
    mes = this.meses[fecha.getMonth()]; 
    notaExpedicion = notaExpedicion.replace("{mes}", mes.toString());
    ano = fecha.getFullYear();
    notaExpedicion = notaExpedicion.replace("{ano}", ano.toString());
    pdf.add(new Txt(notaExpedicion).margin([50, 10, 0, 0]).end);
    pdf.add(new Txt("Cordialmente,").margin([50, 10, 0, 0]).end);
    pdf.add(
      await new Img(ObjConfigCL.imagenFirmaDir)
        .margin([50, 0, 0, 0])
        .width(130)
        .build()
    );
    pdf.add(
      new Txt("_____________________________").margin([50, -30, 0, 0]).end
    );
    pdf.add(new Txt(ObjConfigCL.nombreDirectorRH).margin([50, 0, 0, 0]).end);
    pdf.add(new Txt(ObjConfigCL.nombreCargoDir).fontSize(7).margin([50, 0, 0, 0]).end);
    pdf.pageMargins([ 40, 100, 40, 100 ]);
    pdf.pageSize("A4");
    pdf.create().open();
    setTimeout(() => {
      sessionStorage.clear();
      window.close();
    }, 5000);
  }

  CrearCartaConFunciones() {
    
  }
}
