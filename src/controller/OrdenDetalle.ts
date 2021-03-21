import { getRepository } from 'typeorm';
import { Request, Response } from 'express';
import { DetalleOrden } from '../entity/Detalles_Orden';
import OrdenController from './Orden';
import Stripe from 'stripe';
const stripe = new Stripe(process.env.SECRETKEYSTRIPE, {apiVersion :'2020-08-27',})

const orden = OrdenController;

//const stripe = require('stripe')(process.env.SECRETKEYSTRIPE);

class OrdenDetalle {
    static MostrarDteOrdenPaginadas = async ( req : Request, res : Response ) => {
        let pagina  = req.query.pagina || 1;
        pagina = Number(pagina);
        let take = req.query.limit || 5;
        take = Number(take);
        try {
            const ordenesDRepo = getRepository(DetalleOrden);
            const [ordenesD, totalItems] = await ordenesDRepo.createQueryBuilder('orden_detalle')
            .innerJoin('orden_detalle.producto', 'producto')
            .innerJoin('orden_detalle.orden', 'orden')
            .addSelect(['producto.nombreProducto'])
            .addSelect(['orden.fecha_Orden','orden.cliente'])
            .skip((pagina - 1 ) * take)
            .take(take)
            .getManyAndCount()

            if (ordenesD.length > 0) {
                let totalPages : number = totalItems / take;
                if(totalPages % 1 == 0 ){
                    totalPages = Math.trunc(totalPages) + 1;
                }
                let nextPage : number = pagina >= totalPages ? pagina : pagina + 1
                let prevPage : number = pagina <= 1 ? pagina : pagina -1
                res.json({ok: true, ordenesD, totalItems, totalPages, currentPage : pagina, nextPage, prevPage})
            } else {
                res.json({message : 'No se encontraron resultados!'})
            }
        } catch (error) {
            res.json({message : 'Algo ha salido mal!'})
        }
    };
    static MostrarDteOrderByOrderId = async ( req : Request, res : Response ) => {
        const {orden} = req.body;
        try {
            const ordenesDRepo = getRepository(DetalleOrden);
            const ordenesD = await ordenesDRepo.createQueryBuilder('orden_detalle')
            .innerJoin('orden_detalle.producto', 'producto')
            .innerJoin('orden_detalle.orden', 'orden')
            .addSelect(['producto.nombreProducto'])
            .addSelect(['orden.fecha_Orden','orden.cliente'])
            .where({orden})
            .getMany()
            if (ordenesD.length > 0) {
                res.json({ok: true, ordenesD})
            } else {
                res.json({message : 'No se encontraron resultados!'})
            }
        } catch (error) {
            res.json({message : 'Algo ha salido mal!'})
        }
    }
}

export default OrdenDetalle;