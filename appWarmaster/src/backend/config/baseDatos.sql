CREATE DATABASE torneos;

USE torneos;

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
  pais VARCHAR(200);
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE torneo_saga (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre_torneo VARCHAR(200) NOT NULL,
  rondas_max INT NOT NULL,
  epoca_torneo VARCHAR(100) UNIQUE,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  ubicacion VARCHAR(200),
  puntos_banda INT NOT NULL,
  participantes_max INT NOT NULL,
  estado ENUM('pendiente', 'en_curso', 'finalizado') DEFAULT 'pendiente';
  partida_ronda_1 VARCHAR(100) NOT NULL,
  partida_ronda_2 VARCHAR(100) NOT NULL,
  partida_ronda_3 VARCHAR(100) NOT NULL,
  partida_ronda_4 VARCHAR(100),
  partida_ronda_5 VARCHAR(100);
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES usuarios(id)
);

CREATE TABLE participantes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  torneo_id INT NOT NULL,
  jugador_id INT NOT NULL,
  epoca VARCHAR(100),
  faccion VARCHAR(100) NOT NULL,
  composicion_ejercito VARCHAR(200) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (torneo_id) REFERENCES torneo_saga(id) ON DELETE CASCADE,
  FOREIGN KEY (jugador_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (epoca) REFERENCES torneo_saga(epoca_torneo),
  UNIQUE KEY unique_participante (torneo_id, jugador_id)
);

CREATE TABLE choque_bandas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  torneo_id INT NOT NULL,
  jugador1_id INT NOT NULL,
  jugador2_id INT NOT NULL,
  puntos_cr_j1 INT DEFAULT 0,
  puntos_cr_j2 INT DEFAULT 0,
  puntos_torneo_cr_j1 INT NOT NULL,
  puntos_torneo_cr_j2 INT NOT NULL,
  puntos_masacre_cr_j1 INT NOT NULL,
  puntos_masacre_cr_j2 INT NOT NULL,
  warlord_muerto_cr_j1 BOOLEAN DEFAULT FALSE,
  warlord_muerto_cr_j2 BOOLEAN DEFAULT FALSE,
  resultado_cr ENUM('victoria_j1', 'victoria_j2', 'empate', 'pendiente') DEFAULT 'pendiente',
  ronda INT DEFAULT 1,
  fecha_partida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (torneo_id) REFERENCES torneo_saga(id) ON DELETE CASCADE,
  FOREIGN KEY (jugador1_id) REFERENCES usuarios(id),
  FOREIGN KEY (jugador2_id) REFERENCES usuarios(id)
);

CREATE TABLE captura (
  id INT PRIMARY KEY AUTO_INCREMENT,
  torneo_id INT NOT NULL,
  jugador1_id INT NOT NULL,
  jugador2_id INT NOT NULL,
  puntos_captura_j1 INT DEFAULT 0,
  puntos_captura_j2 INT DEFAULT 0,
  puntos_victoria_captura_j1 INT NOT NULL,
  puntos_victoria_captura_j2 INT NOT NULL,
  puntos_torneo_captura_j1 INT NOT NULL,
  puntos_torneo_captura_j2 INT NOT NULL,
  puntos_masacre_captura_j1 INT NOT NULL,
  puntos_masacre_captura_j2 INT NOT NULL,
  warlord_muerto_captura_j1 BOOLEAN DEFAULT FALSE,
  warlord_muerto_captura_j2 BOOLEAN DEFAULT FALSE,
  resultado_captura ENUM('victoria_j1', 'victoria_j2', 'empate', 'pendiente') DEFAULT 'pendiente',
  ronda INT DEFAULT 1,
  fecha_partida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (torneo_id) REFERENCES torneo_saga(id) ON DELETE CASCADE,
  FOREIGN KEY (jugador1_id) REFERENCES usuarios(id),
  FOREIGN KEY (jugador2_id) REFERENCES usuarios(id)
);

CREATE TABLE conquista (
  id INT PRIMARY KEY AUTO_INCREMENT,
  torneo_id INT NOT NULL,
  jugador1_id INT NOT NULL,
  jugador2_id INT NOT NULL,
  puntos_conquista_j1 INT DEFAULT 0,
  puntos_conquista_j2 INT DEFAULT 0,
  puntos_victoria_conquista_j1 INT NOT NULL,
  puntos_victoria_conquista_j2 INT NOT NULL,
  puntos_torneo_conquista_j1 INT NOT NULL,
  puntos_torneo_conquista_j2 INT NOT NULL,
  puntos_masacre_conquista_j1 INT NOT NULL,
  puntos_masacre_conquista_j2 INT NOT NULL,
  warlord_muerto_conquista_j1 BOOLEAN DEFAULT FALSE,
  warlord_muerto_conquista_j2 BOOLEAN DEFAULT FALSE,
  resultado_conquista ENUM('victoria_j1', 'victoria_j2', 'empate', 'pendiente') DEFAULT 'pendiente',
  ronda INT DEFAULT 1,
  fecha_partida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (torneo_id) REFERENCES torneo_saga(id) ON DELETE CASCADE,
  FOREIGN KEY (jugador1_id) REFERENCES usuarios(id),
  FOREIGN KEY (jugador2_id) REFERENCES usuarios(id)
);

CREATE TABLE desacralizacion (
  id INT PRIMARY KEY AUTO_INCREMENT,
  torneo_id INT NOT NULL,
  jugador1_id INT NOT NULL,
  jugador2_id INT NOT NULL,
  puntos_desacralizacion_j1 INT DEFAULT 0,
  puntos_desacralizacion_j2 INT DEFAULT 0,
  objetivos_destruidos ENUM ('0', '1', '2', '3') DEFAULT '0',
  puntos_torneo_desacralizacion_j1 INT NOT NULL,
  puntos_torneo_desacralizacion_j2 INT NOT NULL,
  puntos_masacre_desacralizacion_j1 INT NOT NULL,
  puntos_masacre_desacralizacion_j2 INT NOT NULL,
  warlord_muerto_desacralizacion_j1 BOOLEAN DEFAULT FALSE,
  warlord_muerto_desacralizacion_j2 BOOLEAN DEFAULT FALSE,
  resultado_desacralizacion ENUM('victoria_j1', 'victoria_j2', 'empate', 'pendiente') DEFAULT 'pendiente',
  ronda INT DEFAULT 1,
  fecha_partida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (torneo_id) REFERENCES torneo_saga(id) ON DELETE CASCADE,
  FOREIGN KEY (jugador1_id) REFERENCES usuarios(id),
  FOREIGN KEY (jugador2_id) REFERENCES usuarios(id)
);

CREATE TABLE avance (
  id INT PRIMARY KEY AUTO_INCREMENT,
  torneo_id INT NOT NULL,
  jugador1_id INT NOT NULL,
  jugador2_id INT NOT NULL,
  puntos_avance_j1 INT DEFAULT 0,
  puntos_avance_j2 INT DEFAULT 0,
  puntos_victoria_avance_j1 INT NOT NULL,
  puntos_victoria_avance_j2 INT NOT NULL,
  puntos_torneo_avance_j1 INT NOT NULL,
  puntos_torneo_avance_j2 INT NOT NULL,
  puntos_masacre_avance_j1 INT NOT NULL,
  puntos_masacre_avance_j2 INT NOT NULL,
  warlord_muerto_avance_j1 BOOLEAN DEFAULT FALSE,
  warlord_muerto_avance_j2 BOOLEAN DEFAULT FALSE,
  resultado_avance ENUM('victoria_j1', 'victoria_j2', 'empate', 'pendiente') DEFAULT 'pendiente',
  ronda INT DEFAULT 1,
  fecha_partida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (torneo_id) REFERENCES torneo_saga(id) ON DELETE CASCADE,
  FOREIGN KEY (jugador1_id) REFERENCES usuarios(id),
  FOREIGN KEY (jugador2_id) REFERENCES usuarios(id)
);

