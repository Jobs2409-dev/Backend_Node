// controllers/auth.controller.js
import { Usuario } from '../models/Usuario.js';
import jwt from 'jsonwebtoken';

// Registro público (Exclusivo para Vecinos)
export const registrarUsuario = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Se fuerza el rol VECINO para el registro abierto
        const usuario = await Usuario.create({
            email,
            password,
            rol: 'VECINO'
        });

        res.status(201).json({
            mensaje: 'Usuario vecino registrado exitosamente',
            usuario: {
                id: usuario._id,
                email: usuario.email,
                rol: usuario.rol
            }
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ mensaje: 'El email ya está registrado' });
        }

        res.status(400).json({
            mensaje: 'Error al registrar el usuario',
            detalle: error.message
        });
    }
};

// Registro interno de Operadores/Admins (Ejecutado por un Admin)
export const crearOperador = async (req, res) => {
    try {
        const { email, password, rol } = req.body;

        const rolAsignado = (rol && ['OPERADOR', 'ADMIN'].includes(rol)) ? rol : 'OPERADOR';

        const usuario = await Usuario.create({
            email,
            password,
            rol: rolAsignado
        });

        res.status(201).json({
            mensaje: `Usuario personal interno (${rolAsignado}) creado exitosamente`,
            usuario: {
                id: usuario._id,
                email: usuario.email,
                rol: usuario.rol
            }
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ mensaje: 'El email ya está registrado' });
        }

        res.status(400).json({
            mensaje: 'Error al crear el operador',
            detalle: error.message
        });
    }
};

// Login general para cualquier rol
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const usuario = await Usuario.findOne({ email });
        if (!usuario) {
            return res.status(404).json({ mensaje: 'Credenciales inválidas.' });
        }

        const passwordCorrecto = await usuario.comparePassword(password);
        if (!passwordCorrecto) {
            return res.status(404).json({ mensaje: 'Credenciales inválidas.' });
        }

        if (usuario.activo === false) {
            return res.status(403).json({ mensaje: 'Cuenta suspendida. Contacta al administrador.' });
        }

        const payload = {
            id: usuario._id,
            email: usuario.email,
            rol: usuario.rol
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRATION || '24h' }
        );

        res.status(200).json({
            mensaje: 'Login exitoso',
            token,
            usuario: payload
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ mensaje: 'Error en el servidor', detalle: error.message });
    }
};

// Listar todos los usuarios (Solo ADMIN)
export const obtenerUsuarios = async (req, res) => {
    try {
        const usuarios = await Usuario.find()
            .select('-password')
            .sort({ createdAt: -1 });

        res.status(200).json({
            ok: true,
            total: usuarios.length,
            usuarios
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener usuarios', detalle: error.message });
    }
};

// Actualizar usuario / Borrado lógico (Solo ADMIN)
export const actualizarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, rol, password, activo } = req.body;

        const usuario = await Usuario.findById(id);
        if (!usuario) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        if (String(usuario._id) === String(req.usuario.id)) {
            if (rol && rol !== 'ADMIN') {
                return res.status(400).json({ mensaje: 'No puedes cambiar tu propio rol de Administrador' });
            }
            if (typeof activo === 'boolean' && activo === false) {
                return res.status(400).json({ mensaje: 'No puedes suspender tu propia cuenta de Administrador' });
            }
        }

        if (email) usuario.email = email;
        if (rol && ['VECINO', 'OPERADOR', 'ADMIN'].includes(rol)) usuario.rol = rol;
        if (typeof activo === 'boolean') usuario.activo = activo;
        if (password && password.length >= 4) usuario.password = password;

        await usuario.save();

        res.status(200).json({
            mensaje: 'Usuario actualizado exitosamente',
            usuario: {
                id: usuario._id,
                email: usuario.email,
                rol: usuario.rol,
                activo: usuario.activo
            }
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ mensaje: 'Ese correo ya está en uso por otro usuario' });
        }
        res.status(400).json({ mensaje: 'Error al actualizar usuario', detalle: error.message });
    }
};