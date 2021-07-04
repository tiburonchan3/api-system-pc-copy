import { Router } from "express";
import { CheckJwt } from '../middleware/jwt';
import OrdenDetalle from '../controller/OrdenDetalle';

const router = Router();
const ordenDte = OrdenDetalle;

router.post('/or-detalles', ordenDte.MostrarDteOrdenPaginadas);
router.post('/details',CheckJwt, ordenDte.MostrarDteOrderByOrderId)


export default router;