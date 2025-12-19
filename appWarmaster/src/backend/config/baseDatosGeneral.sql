CREATE DATABASE torneos;

USE torneos;

/**
=======================
   TABLA USUARIO y TORNEOS
   ======================
*/

CREATE TABLE usuarios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  nombre_alias VARCHAR(100),
  club VARCHAR(100),
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  rol ENUM('organizador', 'jugador') DEFAULT 'jugador',
  localidad VARCHAR(200),
  pais VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE torneos_sistemas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sistema VARCHAR (50) DEFAULT 'SAGA',
  nombre_torneo VARCHAR(200) NOT NULL,
  tipo_torneo ENUM ('Individual', 'Por equipos') DEFAULT 'Individual',
  num_jugadores_equipo INT DEFAULT 3 CHECK (num_jugadores_equipo BETWEEN 2 AND 6),
  rondas_max INT NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  ubicacion VARCHAR(200),
  puntos_banda INT NOT NULL,
  puntos_ejercito INT NOT NULL, /*PARA  FOW Y BOLT*/
  participantes_max INT NOT NULL,
  equipos_max INT NOT NULL,
  ronda_actual INT DEFAULT 1,
  estado ENUM('pendiente', 'en_curso', 'finalizado') DEFAULT 'pendiente',
  partida_ronda_1 VARCHAR(100) NOT NULL,
  partida_ronda_2 VARCHAR(100) NOT NULL,
  partida_ronda_3 VARCHAR(100) NOT NULL,
  partida_ronda_4 VARCHAR(100),
  partida_ronda_5 VARCHAR(100),
  bases_torneo LONGBLOB,
  bases_nombre VARCHAR(255), 
  base_tamaño INT,          
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expiracion DATETIME NOT NULL,
    usado BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_expiracion (expiracion)
);
