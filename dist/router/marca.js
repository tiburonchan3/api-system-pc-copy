"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const role_1 = require("../middleware/role");
const jwt_1 = require("../middleware/jwt");
const Marca_1 = require("../controller/Marca");
const router = express_1.Router();
const marca = Marca_1.default;
router.get('/', marca.MostrarMarcas);
router.get('/marcas-paginated', marca.MostrarMarcasPaginadas);
router.post('/', jwt_1.CheckJwt, marca.AgregarMarca);
router.put('/status', jwt_1.CheckJwt, marca.EstadoMarca);
router.get('/:id', marca.ObtenerMarcaPorID);
router.put('/:id', jwt_1.CheckJwt, marca.ActualizarMarca);
router.delete('/:id', [jwt_1.CheckJwt, role_1.checkRole(['admin'])], marca.EliminarMarca);
//estado del producto
exports.default = router;
//# sourceMappingURL=marca.js.map