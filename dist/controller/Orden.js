"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const Order_1 = require("../entity/Order");
const Producto_1 = require("../entity/Producto");
const Detalles_Orden_1 = require("../entity/Detalles_Orden");
const Cliente_1 = require("../entity/Cliente");
const nodemailer_config_1 = require("../config/nodemailer.config");
const Cupones_1 = require("../entity/Cupones");
class OrdenController {
    constructor() {
        //mostrar ordenes para evento en los sockets
        this.MostrarOrdenes = () => __awaiter(this, void 0, void 0, function* () {
            try {
                const ordenRepo = typeorm_1.getRepository(Order_1.Order);
                const orden = yield ordenRepo.find();
                if (orden.length > 0) {
                    return orden;
                }
            }
            catch (error) {
                return [];
            }
        });
    }
}
//mostrar ordenes Paginadas
OrdenController.MostrarOrdenPaginadas = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let pagina = req.query.pagina || 1;
    pagina = Number(pagina);
    let take = req.query.limit || 5;
    let searchOrden = req.query.searchOrden || "";
    take = Number(take);
    try {
        const ordenesRepo = typeorm_1.getRepository(Order_1.Order);
        const [ordenes, totalItems] = yield ordenesRepo.createQueryBuilder('orden')
            .innerJoin('orden.cliente', 'cliente')
            .addSelect(['cliente.nombre', 'cliente.apellido', 'cliente.direccion'])
            .skip((pagina - 1) * take)
            .take(take)
            .where("orden.codigoOrden like : codeOrden", { codeOrden: `%${searchOrden}%` })
            .getManyAndCount();
        if (ordenes.length > 0) {
            let totalPages = totalItems / take;
            if (totalPages % 1 == 0) {
                totalPages = Math.trunc(totalPages) + 1;
            }
            let nextPage = pagina >= totalPages ? pagina : pagina + 1;
            let prevPage = pagina <= 1 ? pagina : pagina - 1;
            res.json({ ok: true, ordenes, totalItems, totalPages, currentPage: pagina, nextPage, prevPage });
        }
        else {
            res.json({ message: 'No se encontraron resultados!' });
        }
    }
    catch (error) {
        res.json({ message: 'Algo ha salido mal!' });
    }
});
//agregar recervacion
OrdenController.AddReservacion = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { clienteid } = res.locals.jwtPayload;
    const ordenRepo = typeorm_1.getRepository(Order_1.Order);
    const ordeDRepo = typeorm_1.getRepository(Detalles_Orden_1.DetalleOrden);
    const proRepo = typeorm_1.getRepository(Producto_1.Producto);
    const clienteRepo = typeorm_1.getRepository(Cliente_1.Cliente);
    const cuponRepo = typeorm_1.getRepository(Cupones_1.Cupon);
    let CODIGO_CUPON = req.query.CODIGO_CUPON;
    let cuponExist;
    let ordenC;
    let items = req.body;
    let totalPrice = 0;
    let totalDesc = 0;
    let total;
    let descuentoCupon = 0.00;
    const itemEmail = [];
    try {
        //verificar CODE_CUPON
        if (CODIGO_CUPON) {
            try {
                cuponExist = yield cuponRepo.findOneOrFail({ where: { codigo: CODIGO_CUPON } });
                if (cuponExist.status == true) {
                    return res.status(400).json({ message: 'El cupón con el codigo: ' + CODIGO_CUPON + ' , ya ha sido utilizado!!!' });
                }
                else {
                    let date = new Date();
                    let month = date.getMonth() + 1;
                    const codigoOrden = Math.floor(Math.random() * 90000) + 10000;
                    const codigoO = 'SYSTEM_PC-' + codigoOrden + month;
                    const or = new Order_1.Order();
                    or.cliente = clienteid;
                    or.codigoOrden = codigoO;
                    or.status = 0;
                    ordenC = yield ordenRepo.save(or);
                    for (let index = 0; index < items.length; index++) {
                        let amount = 0;
                        const item = items[index];
                        const productoItem = yield proRepo.findOneOrFail(item.id);
                        try {
                            let operacion = productoItem.costo_standar * item.qty;
                            let Totaldesc = 0.00;
                            let totalPay = operacion;
                            //let qtyExist = productoItem.catidad_por_unidad - item.qty;
                            amount += totalPay;
                            totalPrice += totalPay;
                            totalDesc += Totaldesc;
                            const OnlyTwoDecimals = amount.toFixed(2);
                            const parseAmount = parseInt(OnlyTwoDecimals.replace('.', '.'), 10);
                            console.log(OnlyTwoDecimals, productoItem.nombreProducto, Totaldesc);
                            let itemString = item.qty.toString();
                            let itm = { codigoOrden: ordenC.codigoOrden, cantidad: itemString, producto: productoItem.nombreProducto, precioOriginal: productoItem.costo_standar, descuento: Totaldesc, totalNto: OnlyTwoDecimals };
                            itemEmail.push(itm);
                            try {
                                //save Orden Detalle
                                const saveOD = new Detalles_Orden_1.DetalleOrden();
                                saveOD.orden = ordenC,
                                    saveOD.producto = productoItem,
                                    saveOD.cantidad = item.qty,
                                    saveOD.totalUnidad = amount,
                                    saveOD.descuento = Totaldesc;
                                const Save = yield ordeDRepo.save(saveOD);
                            }
                            catch (error) {
                                console.log(error);
                            }
                        }
                        catch (error) {
                            return console.log('Algo salio mal!!!');
                        }
                    }
                }
                //Guardar Orden
                console.log(cuponExist);
            }
            catch (error) {
                return res.status(400).json({ message: 'El cupón con el codigo: ' + CODIGO_CUPON + ' no es valido!!!' });
            }
        }
        else {
            //Guardar Orden
            let date = new Date();
            let month = date.getMonth() + 1;
            const codigoOrden = Math.floor(Math.random() * 90000) + 10000;
            const codigoO = 'SYSTEM_PC-' + codigoOrden + month;
            const or = new Order_1.Order();
            or.cliente = clienteid;
            or.codigoOrden = codigoO;
            or.status = 0;
            ordenC = yield ordenRepo.save(or);
            for (let index = 0; index < items.length; index++) {
                let amount = 0;
                const item = items[index];
                const productoItem = yield proRepo.findOneOrFail(item.id);
                let operacion = productoItem.costo_standar * item.qty;
                let Totaldesc = operacion * productoItem.descuento / 100;
                let totalPay = operacion - Totaldesc;
                //let qtyExist = productoItem.catidad_por_unidad - item.qty;
                amount += totalPay;
                totalPrice += totalPay;
                totalDesc += Totaldesc;
                const OnlyTwoDecimals = amount.toFixed(2);
                const parseAmount = parseInt(OnlyTwoDecimals.replace('.', '.'), 10);
                console.log(OnlyTwoDecimals, productoItem.nombreProducto, Totaldesc);
                let itemString = item.qty.toString();
                let itm = { codigoOrden: ordenC.codigoOrden, cantidad: itemString, producto: productoItem.nombreProducto, precioOriginal: productoItem.costo_standar, descuento: Totaldesc, totalNto: OnlyTwoDecimals };
                itemEmail.push(itm);
                try {
                    //save Orden Detalle
                    const saveOD = new Detalles_Orden_1.DetalleOrden();
                    saveOD.orden = ordenC,
                        saveOD.producto = productoItem,
                        saveOD.cantidad = item.qty,
                        saveOD.totalUnidad = amount,
                        saveOD.descuento = Totaldesc;
                    const Save = yield ordeDRepo.save(saveOD);
                }
                catch (error) {
                    console.log(error);
                }
            }
        }
    }
    catch (error) {
        return console.log('Ocurrio un error inesperado!!!');
    }
    if (cuponExist) {
        const Totaldesc = totalPrice * cuponExist.descuento / 100;
        const Totalprice = totalPrice - Totaldesc;
        console.log(Totaldesc, Totalprice);
        descuentoCupon = Totaldesc;
        total = Totalprice.toFixed(2);
        ordenC.PrecioTotal = Totalprice;
        ordenC.TotalDesc = Totaldesc;
        const actualizarOrden = yield ordenRepo.save(ordenC);
        cuponExist.status = true;
        const statusCupon = yield cuponRepo.save(cuponExist);
        res.json({ itemEmail });
    }
    else {
        ordenC.PrecioTotal = totalPrice;
        ordenC.TotalDesc = totalDesc;
        const actualizarOrden = yield ordenRepo.save(ordenC);
        total = totalPrice.toFixed(2);
        res.json({ itemEmail });
    }
    //try to send email
    try {
        let direccionLocal = "6 Avenida Norte 3-11, Sonsonate, Sonsonate";
        let date = new Date();
        const infoCliente = yield clienteRepo.findOneOrFail(clienteid.id);
        let subject = ` ${infoCliente.nombre + " " + infoCliente.apellido + " Reservacion Exitosa!!!"} `;
        console.log(subject);
        console.log(direccionLocal, date, infoCliente);
        let content = itemEmail.reduce((a, b) => {
            return a + '<tr><td>' + b.cantidad + '</td><td>' + b.producto + '</td><td>' + '$' + b.precioOriginal + '</td><td>' + '$' + b.descuento + '</td><td>' + '$' + b.totalNto + '</td></tr>';
        }, '');
        let descTotal = itemEmail.map((a) => a.descuento).reduce((a, b) => a + b);
        console.log(descTotal);
        yield nodemailer_config_1.transporter.sendMail({
            from: `"System-PC Sonsonate" <castlem791@gmail.com>`,
            to: infoCliente.email,
            subject: subject,
            html: ` <!DOCTYPE html>
                        <html lang="en">
                        <head> </head>
                        <body><div>
                        <h3>Reservacion Exitosa!!!</h3>
                        <h4>Comprador : </h4>
                <p>Nombre: ${infoCliente.nombre + " " + infoCliente.apellido}</p>
                <p>Email : ${infoCliente.email}</p>
                <p>Dia reservacion : ${date}</p>
                <p>Codigo Orden: ${ordenC.codigoOrden}</p>

                <h4>Vendido Por: </h4>
                <p>Dirección post-compra : </p>
                <p>System-Pc Sonsonate, ${direccionLocal}</p>
                <p>Productos reservados: </p>

                <table style = "border: hidden" >
                    <thead class="tablahead" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">
                    <tr>
                    <th id="cantidad">Cantidad</th>
                    <th id="producto">Producto</th>
                    <th id="precioO">Precio Original</th>
                    <th id="desc">Descuento por producto</th>
                    <th id="TotalNto">Total Nto</th>
                    </tr>
                </thead>
                <tbody id="bodytabla">

                ${content}

                </tbody>
                </table>
                <p>Descuento Total : $${totalDesc}</p>

                <p>Descuento en Cupon : $${descuentoCupon}</p>

                <p>Total a Pagar: $${total}</p>
                <a href="${"Link tienda"}">Visitanos pronto !!!</a>
                </div>
                </body>
                </html>`
        });
    }
    catch (error) {
        return console.log('Algo salio mal al intentar enviar email!!!');
    }
});
//estado Orden
OrdenController.EstadoOrden = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let ordenDetalle;
    //let orderId;
    const { id } = req.params;
    const OrdenRepo = typeorm_1.getRepository(Order_1.Order);
    const ordenDRepo = typeorm_1.getRepository(Detalles_Orden_1.DetalleOrden);
    const proRepo = typeorm_1.getRepository(Producto_1.Producto);
    let itemsOrden;
    try {
        const order = yield OrdenRepo.findOneOrFail({ where: { id } });
        console.log(order);
        let orden = order.id;
        if (order.status == 1 || order.status == 2) {
            return res.json({ ok: false, message: 'La orden ya fue completada!!!' });
        }
        else {
            order.status = 1;
            const OrdenComplete = yield OrdenRepo.save(order);
            try {
                ordenDetalle = yield ordenDRepo.createQueryBuilder('orden_detalle')
                    .innerJoin('orden_detalle.producto', 'producto')
                    .innerJoin('orden_detalle.orden', 'orden')
                    .addSelect(['producto.nombreProducto', 'producto.id'])
                    .addSelect(['orden.fecha_Orden', 'orden.cliente'])
                    .where({ orden })
                    .getMany();
                if (ordenDetalle.length > 0) {
                    //recorrer arreglo obtenido desde la base de datos
                    for (let index = 0; index < ordenDetalle.length; index++) {
                        const item = ordenDetalle[index];
                        let producto = item.producto.id;
                        //buscarlos productos por id
                        const productoItem = yield proRepo.findOneOrFail(producto);
                        //intentar guardar los productos con la cantidad actualizda
                        try {
                            let qtyExits = productoItem.catidad_por_unidad - item.cantidad;
                            productoItem.catidad_por_unidad = qtyExits;
                            const producto = yield proRepo.save(productoItem);
                            //res.json({message : 'Exito!', producto});
                            console.log(producto);
                        }
                        catch (error) {
                            console.log(error);
                        }
                    }
                }
                else {
                    res.json({ message: 'No se encontraron resultados!' });
                }
            }
            catch (error) {
                console.log(error);
            }
            return res.json({ ok: true, OrdenComplete });
        }
    }
    catch (error) {
        return res.status(404).json({ message: 'No hay registros con este id: ' + id });
    }
});
exports.default = OrdenController;
//# sourceMappingURL=Orden.js.map