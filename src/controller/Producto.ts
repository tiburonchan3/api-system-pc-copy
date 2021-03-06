import { validate } from 'class-validator';
import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { Producto } from '../entity/Producto';
import { UploadedFile } from 'express-fileupload';
import * as path from 'path';
import * as fs from 'fs';

class ProductoController{

    //mostrar todos los productos
    
    static MostrarProductos = async ( req : Request, res : Response) => {
        let pagina = req.query.pagina || 0;
        pagina = Number(pagina);
        let take = req.query.limit || 10;
        take = Number(take)
        try {
            const productoRepo = getRepository(Producto)
            const producto = await productoRepo.createQueryBuilder('producto')
            //.query(' select p.*, pp.nombre_proveedor, pm.marca, pc.categoria  from Producto p inner join proveedor pp, marca pm, categoria pc where pp.id = p.proveedorId and pm.id = p.marcaId and pc.id = p.categoriaId').
            .leftJoin('producto.proveedor', 'prov', )
            .addSelect(['prov.nombre_proveedor'])
            .leftJoin('producto.marca', 'marca',)
            .addSelect(['marca.marca'])
            .leftJoin('producto.categoria', 'cat')
            .addSelect(['cat.categoria'])
            .skip(pagina)
            .take(take)
            .getManyAndCount();
            if (producto.length > 0) {
                res.json({productos : producto})
            } else {
                res.json({message : 'No se encontraron resultados'})
            }
        } catch (error) {
            res.json({message:'Algo ha salido mal'})
        }
        
    };

    //mostrar productos paginados
    static ProductosPaginados = async ( req : Request, res : Response) => {
        let pagina = req.query.pagina || 0;
        pagina = Number(pagina);
        let take = req.query.limit || 10;
        take = Number(take)
        try {
            const productoRepo = getRepository(Producto)
            const producto = await productoRepo.createQueryBuilder('producto')
            .skip(pagina)
            .take(take)
            //.orderBy('codigo_producto', 'DESC')
            .execute()
            if (producto.length > 0) {
                res.json({productos : producto})
            } else {
                res.json({message : 'No se encontraron resultados'})
            }
        } catch (error) {
            res.json({message:'Algo ha salido mal'})
        }
        
    };

    //mostrar productos por categorias
    static MostrarProductosCategoria = async ( req : Request, res : Response) => {
        const {categoria} = req.body;
        let pagina = req.query.pagina || 0;
        pagina = Number(pagina);
        let take = req.query.limit || 10;
        take = Number(take)
        try {
            const productoRepo = getRepository(Producto)
            const producto = await productoRepo.query(` select p.*, pp.nombre_proveedor, pm.marca, pc.categoria 
            from Producto p inner join proveedor pp, marca pm, categoria pc
            where pp.id = p.proveedorId and pm.id = p.marcaId and pc.id = p.categoriaId and pc.categoria = '${categoria}' limit ${take} offset ${pagina} `);

            // .leftJoin('producto.proveedor', 'prov', )
            // .addSelect(['prov.nombre_proveedor'])
            // .leftJoin('producto.marca', 'marca',)
            // .addSelect(['marca.marca'])
            // .leftJoin('producto.categoria', 'cat')
            // .addSelect(['cat.categoria']).where({ categoria })
            // .getMany();

            // producto.map(prod =>{
            //     delete prod.proveedor.email;
            //     delete prod.proveedor.telefono;
            //     delete prod.proveedor.direccion;
            //     delete prod.proveedor.status;
            //     delete prod.marca.status;
            //     delete prod.categoria.status;
            //     return producto
            // });

            if (producto.length > 0) {
                res.json({productos : producto})
            } else {
                res.json({message : 'No se encontraron resultados con categoria: '+ categoria})
            }
        } catch (error) {
            res.json({message:'Algo ha salido mal'})
        }
    };

    //mostrar por marca
    static MostrarProductosMarca = async ( req : Request, res : Response) => {
        const {marca} = req.body;
        let pagina = req.query.pagina || 0;
        pagina = Number(pagina);
        let take = req.query.limit || 10;
        take = Number(take)
        try {
            const productoRepo = getRepository(Producto)
            const producto = await productoRepo.createQueryBuilder('producto')
            .leftJoin('producto.proveedor', 'prov', )
            .addSelect(['prov.nombre_proveedor'])
            .leftJoin('producto.categoria', 'cat')
            .addSelect(['cat.categoria'])
            .leftJoin('producto.marca', 'marca',)
            .addSelect(['marca.marca']).where({ marca })
            .skip(pagina)
            .take(take)
            .getManyAndCount();

            if (producto.length > 0) {
                res.json({productos : producto})
            } else {
                res.json({message : 'No se encontraron resultados'})
            }
        } catch (error) {
            res.json({message:'Algo ha salido mal'})
        }
    };

    //obtener producto por id
    static ObtenerProductoPorID = async (req: Request, res: Response) => {
        const {id} = req.params;
        try {
            const productoRepo = getRepository(Producto)
            const producto = await productoRepo.createQueryBuilder('producto')
            .leftJoin('producto.proveedor', 'prov', )
            .addSelect(['prov.nombre_proveedor'])
            .leftJoin('producto.marca', 'marca',)
            .addSelect(['marca.marca'])
            .leftJoin('producto.categoria', 'cat')
            .addSelect(['cat.categoria']).where({id}) 
            .getOneOrFail()

            const imgdir = path.resolve(__dirname, `../../src/uploads/productos/${producto.image}`);
            if(fs.existsSync(imgdir)){
                res.sendFile(imgdir);
            }else{
                const notImage = path.resolve(__dirname, `../../src/server/assets/${producto.image}`);
                res.sendFile(notImage);
            }

            console.log(producto);
        } catch (error) {
            return res.status(404).json({message:'No hay registros con este id: ' + id });
        }
    };

    //create new product
    static AgregarProducto = async(req: Request, res:Response) => {

        const{codigo_producto, nombre_producto, descripcion, costo_standar, list_price, cantidad_unidad, descuento, proveedor, marca, categoria} = req.body;

        const prodRepo = getRepository(Producto);
        const codeProductExist = await prodRepo.findOne({
            where: {codigo_Producto: codigo_producto}
        });
        if(codeProductExist){
            return res.status(400).json({msj:'Ya existe un producto con el codigo ' + codigo_producto})
        }
        
        const producto = new Producto();
        producto.codigo_Producto = codigo_producto;
        producto.nombreProducto = nombre_producto;
        producto.descripcion = descripcion;
        producto.costo_standar = costo_standar;
        producto.list_price = list_price;
        producto.catidad_por_unidad = cantidad_unidad;
        producto.descuento = descuento;
        producto.proveedor = proveedor;
        producto.marca = marca;
        producto.categoria = categoria;

        //validations
        const ValidateOps = {validationError:{target: false, value: false}};
        const errors = await validate(producto, ValidateOps);
        if (errors.length > 0){
            return res.status(400).json({errors});
        }
        //try to save a product
        try{
            await prodRepo.save(producto);
        }
        catch(e){
            res.status(409).json({message: 'something goes wrong'});
        }
        //all ok
        res.json({mjs: 'Producto creado con exito', producto})
    };
    
    //edit a product
    static EditarProducto = async (req : Request, res : Response) => {
        let producto;
        const {id} = req.params;
        const {nombre_producto, descripcion, costo_standar, list_price, cantidad_unidad, descuento, proveedor, marca, categoria} = req.body;
        const prodRepo = getRepository(Producto);

        try {
            producto = await prodRepo.findOneOrFail(id);
            producto.nombreProducto = nombre_producto;
            producto.descripcion = descripcion;
            producto.costo_standar = costo_standar;
            producto.list_price = list_price;
            producto.catidad_por_unidad = cantidad_unidad;
            producto.descuento = descuento;
            producto.proveedor = proveedor;
            producto.marca = marca;
            producto.categoria = categoria;

        } catch (error) {
            return res.status(404).json({message:'No se han encontrado resultados '})
        }

        const ValidateOps = {validationError:{target: false, value: false}};
        const errors = await validate(producto, ValidateOps);

        //try to save producto
        try {
            await prodRepo.save(producto)
        } catch (error) {
            return res.status(409).json({message:'Algo ha salido mal!'});
        }

        res.json({messge:'Producto actualizado con exito!'});
        console.log(id);
    }

     //delete product
    static EliminarProducto = async (req: Request, res:Response) => {
        const {id} = req.params;
        const prodRepo = getRepository(Producto);
        try{
            const producto = await prodRepo.findOneOrFail(id);
            await prodRepo.delete(producto);
            const imgdir = path.resolve(__dirname, `../../src/uploads/productos/${producto.image}`);
            if(fs.existsSync(imgdir)){
                fs.unlinkSync(imgdir)
            }
            //delete 
            res.status(201).json({message:'Producto eliminado'});
        }
        catch(e){
            res.status(404).json({message:'No hay registros con este id: ' + id});
        }
    };

     //subir imagen producto
    static ImagenProducto = async (req : Request, res : Response) => {

        const {id} = req.params;
        const productRepo = getRepository(Producto);
        let producto;
        if(req.files === undefined || req.files.foto === undefined ){
            res.status(400).json({ok:false, message:'Ningun archivo selecionando'});
        }else{
            let foto = req.files.foto as UploadedFile;
            let fotoName = foto.name.split('.')
            console.log(fotoName);
            let ext = fotoName[fotoName.length -1];
            //extensiones permitidas 
            const extFile = ['png','jpeg', 'jpg', 'git'];
            if(extFile.indexOf(ext) < 0){
                return res.status(400)
                .json({message:'Las estensiones permitidas son ' + extFile.join(', ')})
            }
                else{
                    //cambiar nombre del archivo
                    var nombreFoto = `${id}-${ new Date().getMilliseconds() }.${ext}`
                    foto.mv(`src/uploads/productos/${nombreFoto}`, (err)=>{
                        if (err) {
                        return res.status(500).json({ok: false, err});
                        } 
                    });
                    try{
                        const product = await productRepo.findOneOrFail(id);
                        const imgdir = path.resolve(__dirname, `../../src/uploads/productos/${product.image}`);
                        if(fs.existsSync(imgdir)){
                            fs.unlinkSync(imgdir)
                        }
                        console.log(product);
                    }
                    catch(e){
                        res.status(404).json({message:'No hay registros con este id: ' + id });
                    }
                    //try to save product
                    try {
                        await productRepo.createQueryBuilder().update(Producto).set({image: nombreFoto}).where({id}).execute();
                    } catch (error) {
                        res.status(409).json({message:'Algo ha salido mal!'});
                    }
                }
                res.json({message:'La imagen se ha guardado.'});
        }
    };

    //eliminar imagen Producto
    static EliminarImagenProducto = async (req : Request, res : Response) => {
        const {id} = req.params;
        const productRepo = getRepository(Producto);
        try{
            const product = await productRepo.findOneOrFail(id);
            const imgdir = path.resolve(__dirname, `../../src/uploads/productos/${product.image}`);
            if(fs.existsSync(imgdir)){
                fs.unlinkSync(imgdir)
            }
            console.log(product);
        }
        catch(e){
            res.status(404).json({message:'No hay registros con este id: ' + id });
        }
        //try to save product
        try {
            await productRepo.createQueryBuilder().update(Producto).set({image: "producto.png"}).where({id}).execute();
        } catch (error) {
            res.status(409).json({message:'Algo ha salido mal!'});
        }
        res.json({message : 'imagen de producto eliminada'})
    }

}
export default ProductoController;