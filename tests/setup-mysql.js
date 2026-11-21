import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'vozvecinal_test'
});

try {
    await connection.query(`
        CREATE TABLE IF NOT EXISTS reclamos_areadependencia (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(255) NOT NULL
        )
    `);
    await connection.query(`
        CREATE TABLE IF NOT EXISTS reclamos_categoria (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(255) NOT NULL,
            descripcion TEXT NULL,
            area_id INT NULL,
            FOREIGN KEY (area_id) REFERENCES reclamos_areadependencia(id)
        )
    `);
    await connection.query(`
        INSERT INTO reclamos_categoria (id, nombre, descripcion, area_id)
        VALUES (1, 'Categoría de prueba', 'Categoría para CI', NULL)
        ON DUPLICATE KEY UPDATE nombre = VALUES(nombre)
    `);
} finally {
    await connection.end();
}
