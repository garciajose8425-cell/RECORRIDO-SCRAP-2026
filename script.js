const API="https://script.google.com/macros/s/AKfycbwO0T76S4hoSvIW7yWly9UNBQ2IGqSZDBw3zhtlfebAAPkE9gbSYOweguDO8kK_H-Yk/exec";

const scanInput=document.getElementById("scanInput");
const tbody=document.getElementById("tablaBody");

const btnExportar=document.getElementById("btnExportar");
const fechaExport=document.getElementById("fechaExport");

const modalClave=document.getElementById("modalClave");
const inputClave=document.getElementById("inputClave");
const btnConfirmar=document.getElementById("btnConfirmar");
const btnCancelar=document.getElementById("btnCancelar");

let empleados={};
let activos=[];
let recorridoMayor={};
let subRecorrido={};



function normalizarSAP(v){
return String(v).replace(/\D/g,"");
}



/* FORMATEAR HORA */

function formatearHora(fecha){

if(!fecha) return "";

let d=new Date(fecha);

if(isNaN(d.getTime())) return "";

let h=d.getHours();
let m=String(d.getMinutes()).padStart(2,'0');
let s=String(d.getSeconds()).padStart(2,'0');

let ampm=h>=12?"PM":"AM";

h=h%12;
h=h?h:12;

h=String(h).padStart(2,'0');

return `${h}:${m}:${s} ${ampm}`;

}



/* FORMATEAR DURACION */

function formatearDuracion(valor){

if(!valor) return "";

if(typeof valor==="string" && valor.includes(":"))
return valor;

let d=new Date(valor);

let h=String(d.getUTCHours()).padStart(2,'0');
let m=String(d.getUTCMinutes()).padStart(2,'0');
let s=String(d.getUTCSeconds()).padStart(2,'0');

return `${h}:${m}:${s}`;

}



/* CARGAR SISTEMA */

async function cargarSistema(){

const res=await fetch(API);
const data=await res.json();

empleados={};
activos=data.activos;

data.empleados.forEach(e=>{
empleados[e.SAP_ID]=e;
});

cargarTabla(data.registros,data.activos);

}



/* CARGAR TABLA */

function cargarTabla(registros,activos){

tbody.innerHTML="";


/* ACTIVOS */

activos.forEach(r=>{

const tr=document.createElement("tr");

tr.style.background="#7a6f00";

tr.innerHTML=`

<td><img class="foto" src="fotos/${r.SAP_ID}.jpg" onerror="this.src='fotos/default.jpg'"></td>
<td>${r.FECHA}</td>
<td>${r.SAP_ID}</td>
<td>${r.NOMBRE}</td>
<td>${r.OCUPACION}</td>
<td>${r.AREA}</td>
<td>${r.RECORRIDO}</td>
<td>${formatearHora(r.SALIDA)}</td>
<td>—</td>
<td>EN RECORRIDO</td>

`;

tbody.appendChild(tr);

});


/* FINALIZADOS */

registros.reverse().forEach(r=>{

const tr=document.createElement("tr");

tr.style.background="#0f5132";

tr.innerHTML=`

<td><img class="foto" src="fotos/${r.SAP_ID}.jpg" onerror="this.src='fotos/default.jpg'"></td>
<td>${r.FECHA}</td>
<td>${r.SAP_ID}</td>
<td>${r.NOMBRE}</td>
<td>${r.OCUPACION}</td>
<td>${r.AREA}</td>
<td>${r.RECORRIDO}</td>
<td>${formatearHora(r.SALIDA)}</td>
<td>${formatearHora(r.REGRESO)}</td>
<td>${formatearDuracion(r.DURACION)}</td>

`;

tbody.appendChild(tr);

});

}



/* CONTROL RECORRIDOS */

function obtenerRecorrido(sap){

if(!recorridoMayor[sap]){

recorridoMayor[sap]=1;
subRecorrido[sap]=1;

}

return recorridoMayor[sap]+"."+subRecorrido[sap];

}



function avanzarRecorrido(sap){

subRecorrido[sap]++;

if(subRecorrido[sap]>3){

subRecorrido[sap]=1;
recorridoMayor[sap]++;

}

}



/* ESCANEO INTELIGENTE */

scanInput.addEventListener("keydown",async e=>{

if(e.key!=="Enter") return;

let sap=normalizarSAP(scanInput.value);

scanInput.value="";

if(!empleados[sap]){

alert("SAP no registrado");
return;

}


/* VERIFICAR SI YA ESTA EN RECORRIDO */

let activo=activos.find(a=>String(a.SAP_ID)===String(sap));


if(activo){

/* REGRESO */

await fetch(API,{
method:"POST",
body:JSON.stringify({
tipo:"regreso",
SAP_ID:sap
})
});

}else{

/* SALIDA */

let recorrido=obtenerRecorrido(sap);

await fetch(API,{
method:"POST",
body:JSON.stringify({
tipo:"salida",
SAP_ID:sap,
NOMBRE:empleados[sap].NOMBRE,
OCUPACION:empleados[sap].OCUPACION,
AREA:empleados[sap].AREA,
RECORRIDO:recorrido
})
});

avanzarRecorrido(sap);

}

cargarSistema();

});



/* EXPORTAR */

btnExportar.onclick=()=>{

modalClave.classList.remove("oculto");
inputClave.value="";
inputClave.focus();

};



btnCancelar.onclick=()=>{

modalClave.classList.add("oculto");

};



btnConfirmar.onclick=async ()=>{

if(inputClave.value!=="SCRAP2026"){

alert("Contraseña incorrecta");
return;

}

modalClave.classList.add("oculto");

if(!fechaExport.value){

alert("Seleccione una fecha");
return;

}

const res=await fetch(API);
const data=await res.json();

const partes=fechaExport.value.split("-");
const fechaSeleccionada=`${partes[2]}/${partes[1]}/${partes[0]}`;

const registros=data.registros.filter(r=>r.FECHA===fechaSeleccionada);

if(registros.length===0){

alert("No hay registros para esa fecha");
return;

}

const ws=XLSX.utils.json_to_sheet(registros);

const wb=XLSX.utils.book_new();

XLSX.utils.book_append_sheet(wb,ws,"Recorridos");

XLSX.writeFile(wb,`recorridos_${fechaExport.value}.xlsx`);

};



/* INICIO */

cargarSistema();

setInterval(cargarSistema,8000);
