CREATE DATABASE torneos;

USE torneos;

/**
====================
   TABLA USUARIO
   ===================
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
  pais VARCHAR(200);
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/**
====================
   TABLAS SAGA
   ===================
   */

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
  ronda_actual INT DEFAULT 1,
  estado ENUM('pendiente', 'en_curso', 'finalizado') DEFAULT 'pendiente';
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

CREATE TABLE jugador_torneo_saga (
  id INT PRIMARY KEY AUTO_INCREMENT,
  torneo_id INT NOT NULL,
  jugador_id INT NOT NULL,
  epoca VARCHAR(100),
  faccion VARCHAR(100) NOT NULL,
  composicion_ejercito VARCHAR(200) NOT NULL,
  pagado BOOLEAN DEFAULT FALSE,
  puntos_victoria INT DEFAULT 0,
  puntos_torneo INT DEFAULT 0,
  puntos_masacre INT DEFAULT 0,
  warlord_muerto INT  DEFAULT 0,
  pagado BOOLEAN FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (torneo_id) REFERENCES torneo_saga(id) ON DELETE CASCADE,
  FOREIGN KEY (jugador_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (epoca) REFERENCES torneo_saga(epoca_torneo),
  UNIQUE KEY unique_participante (torneo_id, jugador_id)
);

CREATE TABLE clasificacion_jugadores_saga (
  id INT PRIMARY KEY AUTO_INCREMENT,
  torneo_id INT NOT NULL,
  jugador_id INT NOT NULL,
  partidas_jugadas INT DEFAULT 0, 
  puntos_victoria_totales INT DEFAULT 0,
  puntos_torneo_totales INT DEFAULT 0,
  puntos_masacre_totales INT DEFAULT 0,
  warlord_muerto_totales INT  DEFAULT 0,
  FOREIGN KEY (torneo_id) REFERENCES torneo_saga(id) ON DELETE CASCADE,
  FOREIGN KEY (jugador_id) REFERENCES jugador_torneo_saga(jugador_id) ON DELETE CASCADE,
  UNIQUE KEY unique_torneo_jugador (torneo_id, jugador_id);
)

CREATE TABLE partidas_saga (
  id INT PRIMARY KEY AUTO_INCREMENT,
  torneo_id INT NOT NULL,
  nombre_partida VARCHAR(100) NOT NULL,
  jugador1_id INT NOT NULL,
  jugador2_id INT NOT NULL,
  es_bye BOOLEAN DEFAULT FALSE,
  puntos_victoria_j1 INT DEFAULT 0,
  puntos_victoria_j2 INT DEFAULT 0,
  puntos_torneo_j1 INT DEFAULT 0,
  puntos_torneo_j2 INT DEFAULT 0,
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
  FOREIGN KEY (torneo_id) REFERENCES torneo_saga(id) ON DELETE CASCADE,
  FOREIGN KEY (jugador1_id) REFERENCES usuarios(id),
  FOREIGN KEY (jugador2_id) REFERENCES usuarios(id)
);

/**
====================
   TABLAS WARMASTER
   ===================
   */
CREATE TABLE torneo_warmaster (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre_torneo VARCHAR(200) NOT NULL,
  rondas_max INT NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  ubicacion VARCHAR(200),
  puntos_ejercito INT NOT NULL,
  participantes_max INT NOT NULL,
  estado ENUM('pendiente', 'en_curso', 'finalizado') DEFAULT 'pendiente';
  partida_ronda_1 VARCHAR(100) NOT NULL,
  partida_ronda_2 VARCHAR(100) NOT NULL,
  partida_ronda_3 VARCHAR(100) NOT NULL,
  partida_ronda_4 VARCHAR(100),
  partida_ronda_5 VARCHAR(100),
  bases_torneo_warmaster LONGBLOB,
  bases_nombre_warmaster VARCHAR(255), 
  base_tamaño_warmaster INT,         
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES usuarios(id)
);

CREATE TABLE jugador_torneo_warmaster (
  id INT PRIMARY KEY AUTO_INCREMENT,
  torneo_id INT NOT NULL,
  jugador_id INT NOT NULL,
  ejercito VARCHAR(100) NOT NULL,
  lista_torneo_warmaster LONGBLOB,
  lista_nombre_warmaster VARCHAR(255), 
  lista_tamaño_warmaster INT,    
  pagado BOOLEAN DEFAULT FALSE,
  puntos_victoria INT DEFAULT 0,
  puntos_masacre INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (torneo_id) REFERENCES torneo_warmaster(id) ON DELETE CASCADE,
  FOREIGN KEY (jugador_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  UNIQUE KEY unique_participante (torneo_id, jugador_id)
);

CREATE TABLE partidas_warmaster (
  id INT PRIMARY KEY AUTO_INCREMENT,
  torneo_id INT NOT NULL,
  nombre_partida VARCHAR(100) NOT NULL,
  jugador1_id INT NOT NULL,
  jugador2_id INT NOT NULL,
  puntos_victoria_j1 INT DEFAULT 0,
  puntos_victoria_j2 INT DEFAULT 0,
  puntos_masacre_j1 INT NOT NULL,
  puntos_masacre_j2 INT NOT NULL,
  resultado_warmaster ENUM('victoria_j1', 'victoria_j2', 'empate', 'pendiente') DEFAULT 'pendiente',
  ronda INT DEFAULT 1,
  fecha_partida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (torneo_id) REFERENCES torneo_warmaster(id) ON DELETE CASCADE,
  FOREIGN KEY (jugador1_id) REFERENCES usuarios(id),
  FOREIGN KEY (jugador2_id) REFERENCES usuarios(id)
);

CREATE TABLE clasificacion_jugadores_warmaster (
  id INT PRIMARY KEY AUTO_INCREMENT,
  torneo_id INT NOT NULL,
  jugador_id INT NOT NULL,
  puntos_victoria_totales INT DEFAULT 0,
  puntos_torneo_totales INT DEFAULT 0,
  puntos_masacre_totales INT DEFAULT 0,
  warlord_muerto_totales INT  DEFAULT 0,
  FOREIGN KEY (torneo_id) REFERENCES torneo_warmaster(id) ON DELETE CASCADE,
  FOREIGN KEY (jugador_id) REFERENCES jugador_torneo_warmaster(jugador_id) ON DELETE CASCADE,
)

/**
========================
   TABLAS FLAMES OF WAR
   =======================
   */
CREATE TABLE torneo_fow (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre_torneo VARCHAR(200) NOT NULL,
  rondas_max INT NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  ubicacion VARCHAR(200),
  puntos_ejercito INT NOT NULL,
  participantes_max INT NOT NULL,
  teatro_operaciones VARCHAR(100),
  estado ENUM('pendiente', 'en_curso', 'finalizado') DEFAULT 'pendiente';
  partida_ronda_1 VARCHAR(100) NOT NULL,
  partida_ronda_2 VARCHAR(100) NOT NULL,
  partida_ronda_3 VARCHAR(100) NOT NULL,
  partida_ronda_4 VARCHAR(100),
  partida_ronda_5 VARCHAR(100);
  bases_torneo_fow LONGBLOB,
  bases_nombre_fow VARCHAR(255), 
  base_tamaño_fow INT,   
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES usuarios(id)
);

CREATE TABLE jugador_torneo_fow (
  id INT PRIMARY KEY AUTO_INCREMENT,
  torneo_id INT NOT NULL,
  jugador_id INT NOT NULL,
  ejercito VARCHAR(100) NOT NULL,
  faccion_fow ENUM ('Eje', 'Aliados') default ' ',
  libro VARCHAR(100),
  pagado BOOLEAN DEFAULT FALSE,
  puntos_victoria INT DEFAULT 0,
  puntos_masacre INT DEFAULT 0,
  lista_torneo_fow LONGBLOB,
  lista_nombre_fow VARCHAR(255), 
  lista_tamaño_fow INT,    
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (torneo_id) REFERENCES torneo_saga(id) ON DELETE CASCADE,
  FOREIGN KEY (jugador_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  UNIQUE KEY unique_participante (torneo_id, jugador_id)
);

CREATE TABLE partidas_fow (
  id INT PRIMARY KEY AUTO_INCREMENT,
  torneo_id INT NOT NULL,
  nombre_partida VARCHAR(100) NOT NULL,
  jugador1_id INT NOT NULL,
  jugador2_id INT NOT NULL,
  puntos_victoria_j1 INT DEFAULT 0,
  puntos_victoria_j2 INT DEFAULT 0,
  puntos_masacre_j1 INT NOT NULL,
  puntos_masacre_j2 INT NOT NULL,
  resultado_fow ENUM('victoria_j1', 'victoria_j2', 'empate', 'pendiente') DEFAULT 'pendiente',
  ronda INT DEFAULT 1,
  fecha_partida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (torneo_id) REFERENCES torneo_fow(id) ON DELETE CASCADE,
  FOREIGN KEY (jugador1_id) REFERENCES usuarios(id),
  FOREIGN KEY (jugador2_id) REFERENCES usuarios(id)
);

CREATE TABLE clasificacion_jugadores_fow (
  id INT PRIMARY KEY AUTO_INCREMENT,
  torneo_id INT NOT NULL,
  jugador_id INT NOT NULL,
  puntos_victoria_totales INT DEFAULT 0,
  puntos_torneo_totales INT DEFAULT 0,
  puntos_masacre_totales INT DEFAULT 0,
  warlord_muerto_totales INT  DEFAULT 0,
  FOREIGN KEY (torneo_id) REFERENCES torneo_fow(id) ON DELETE CASCADE,
  FOREIGN KEY (jugador_id) REFERENCES jugador_torneo_fow(jugador_id) ON DELETE CASCADE,
)