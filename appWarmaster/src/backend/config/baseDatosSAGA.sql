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

/**
==============================
TABLAS PARA LOS TORNEOS SAGA
==============================
*/

CREATE TABLE torneo_saga_equipo(
  id INT PRIMARY KEY AUTO_INCREMENT,
  torneo_id INT NOT NULL,
  nombre_equipo VARCHAR(150),
  capitan_id INT NOT NULL,
  puntos_victoria_equipo INT DEFAULT 0,
  puntos_torneo_equipo INT DEFAULT 0,
  puntos_masacre_equipo INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  pagado ENUM ('pendiente', 'pagado') DEFAULT 'pendiente',
 FOREIGN KEY (torneo_id) REFERENCES torneos_sistemas(id) ON DELETE CASCADE,
 FOREIGN KEY (capitan_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE jugador_torneo_saga (
  id INT PRIMARY KEY AUTO_INCREMENT,
  torneo_id INT NOT NULL,
  jugador_id INT NOT NULL,
  equipo_id INT DEFAULT NULL, 
  epoca VARCHAR(100),
  faccion VARCHAR(100) NOT NULL,
  composicion_ejercito VARCHAR(200) NOT NULL,
  pagado BOOLEAN DEFAULT FALSE,
  puntos_victoria INT DEFAULT 0,
  puntos_torneo INT DEFAULT 0,
  puntos_masacre INT DEFAULT 0,
  warlord_muerto INT  DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (torneo_id) REFERENCES torneos_sistemas(id) ON DELETE CASCADE,
  FOREIGN KEY (jugador_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (equipo_id) REFERENCES torneo_saga_equipo(id),
  UNIQUE KEY unique_participante (torneo_id, jugador_id),
  UNIQUE KEY unique_epoca_equipo (equipo_id, epoca) 
);

CREATE TABLE  equipo_miembros (
  id INT PRIMARY KEY AUTO_INCREMENT,
  equipo_id INT NOT NULL,
  usuario_id INT NOT NULL,
  jugador_eq_id INT NOT NULL,
  fecha_union TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (equipo_id) REFERENCES torneo_saga_equipo(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (jugador_eq_id) REFERENCES jugador_torneo_saga(id) ON DELETE CASCADE,
  UNIQUE KEY unique_equipo_usuario_jugador (equipo_id, usuario_id, jugador_eq_id)
);

CREATE TABLE torneo_saga_epocas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  torneo_id INT NOT NULL,
  epoca VARCHAR(100) NOT NULL,
  created_by TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (torneo_id) REFERENCES torneos_sistemas(id) ON DELETE CASCADE,
  UNIQUE KEY unique_epoca_torneo (torneo_id, epoca)
); 

CREATE TABLE clasificacion_jugadores_saga (
  id INT PRIMARY KEY AUTO_INCREMENT,
  torneo_id INT NOT NULL,
  jugador_id INT NOT NULL,
  equipo_id INT  DEFAULT NULL,
  partidas_jugadas INT DEFAULT 0, 
  partidas_ganadas INT DEFAULT 0,
  partidas_empatadas INT DEFAULT 0,
  partidas_perdidas INT DEFAULT 0,
  puntos_victoria_totales INT DEFAULT 0,
  puntos_torneo_totales DECIMAL (10,1) DEFAULT 0,
  puntos_masacre_totales INT DEFAULT 0,
  warlord_muerto_totales INT  DEFAULT 0,
  FOREIGN KEY (torneo_id) REFERENCES torneos_sistemas(id) ON DELETE CASCADE,
  FOREIGN KEY (jugador_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (equipo_id) REFERENCES torneo_saga_equipo(id) ON DELETE CASCADE, 
  UNIQUE KEY unique_torneo_jugador (torneo_id, jugador_id)
);

CREATE TABLE clasificacion_equipos_saga (
  id INT PRIMARY KEY AUTO_INCREMENT,
  torneo_id INT NOT NULL,
  equipo_id INT NOT NULL,
  partidas_jugadas INT DEFAULT 0, 
  partidas_ganadas INT DEFAULT 0,
  partidas_empatadas INT DEFAULT 0,
  partidas_perdidas INT DEFAULT 0,
  puntos_victoria_eq_totales INT DEFAULT 0,
  puntos_torneo_eq_totales INT DEFAULT 0,
  puntos_masacre_eq_totales INT DEFAULT 0,
  warlord_muerto INT DEFAULT 0,
  FOREIGN KEY (torneo_id) REFERENCES torneos_sistemas(id) ON DELETE CASCADE,
  FOREIGN KEY (equipo_id) REFERENCES torneo_saga_equipo(id) ON DELETE CASCADE,
  UNIQUE KEY unique_torneo_equipo (torneo_id, equipo_id)
);

CREATE TABLE partidas_saga (
  id INT PRIMARY KEY AUTO_INCREMENT,
  torneo_id INT NOT NULL,
  equipo1_id INT DEFAULT NULL, 
  equipo2_id INT DEFAULT NULL,
  nombre_partida VARCHAR(100) NOT NULL,
  epoca VARCHAR (150),
  jugador1_id INT NOT NULL,
  jugador2_id INT NOT NULL,
  es_bye BOOLEAN DEFAULT FALSE,
  puntos_victoria_j1 INT DEFAULT 0,
  puntos_victoria_j2 INT DEFAULT 0,
  puntos_torneo_j1 DECIMAL (10,1) DEFAULT 0,
  puntos_torneo_j2 DECIMAL (10,1) DEFAULT 0,
  puntos_masacre_j1 INT DEFAULT 0,
  puntos_masacre_j2 INT DEFAULT 0,
  warlord_muerto_j1 BOOLEAN DEFAULT FALSE,
  warlord_muerto_j2 BOOLEAN DEFAULT FALSE,
  resultado_ps ENUM('victoria_j1', 'victoria_j2', 'empate', 'pendiente') DEFAULT 'pendiente',
  resultado_confirmado BOOLEAN DEFAULT FALSE,
  ronda INT DEFAULT 1,
  mesa INT,
  fecha_partida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  primer_jugador INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (torneo_id) REFERENCES torneos_sistemas(id) ON DELETE CASCADE,
  FOREIGN KEY (equipo1_id) REFERENCES torneo_saga_equipo(id) ON DELETE SET NULL,   
  FOREIGN KEY (equipo2_id) REFERENCES torneo_saga_equipo(id) ON DELETE SET NULL,
  FOREIGN KEY (jugador1_id) REFERENCES usuarios(id),
  FOREIGN KEY (jugador2_id) REFERENCES usuarios(id)
);
