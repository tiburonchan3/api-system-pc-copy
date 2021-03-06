import { Router } from 'express';
import AuthEmployeeController from '../controller/AuthEmployee';
import { CheckJwt } from '../middleware/jwt';

const router = Router()

const auth = AuthEmployeeController;

//login Empleado
router.post('/loginEmployee', auth.Login);
router.post('/add-password/:id',auth.addNewPassword)
//change password
router.post('/change-password', [CheckJwt], auth.passwordChange);
//forgot password
router.put('/forgot-password', auth.forgotPassword);
//create new password
router.put('/new-password', auth.createNewPassword);

//activar registro
router.put('/confirmRegister', auth.ActivarCuenta);

export default router