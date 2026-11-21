// routes/auth.routes.js
// a
import { Router } from 'express';
import { 
    registrarUsuario, 
    crearOperador, 
    login,
    obtenerUsuarios,
    actualizarUsuario
} from '../controllers/auth.controller.js';

import { 
    validarRegistro, 
    validarLogin 
} from '../middlewares/validaciones.middleware.js';

import { verificarToken } from '../middlewares/auth.middleware.js';
import { verificarAdmin } from '../middlewares/rol.middleware.js';

const router = Router();

// Registro público (asigna rol VECINO automáticamente)
router.post('/register', validarRegistro, registrarUsuario);

// CRUD de Personal y Vecinos (Exclusivo ADMIN)
router.post('/crear-operador', verificarToken, verificarAdmin, validarRegistro, crearOperador);
router.get('/usuarios', verificarToken, verificarAdmin, obtenerUsuarios);
router.patch('/usuarios/:id', verificarToken, verificarAdmin, actualizarUsuario);

// Login para cualquier rol
router.post('/login', validarLogin, login);

export default router;