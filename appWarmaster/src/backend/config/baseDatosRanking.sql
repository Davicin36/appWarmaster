CREATE DATABASE rankingTorneos

USE rankingTorneos

CREATE TABLE temporadas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  año INT NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  activa BOOLEAN DEFAULT TRUE,
  elo_inicial INT DEFAULT 1500,
  sistema_juego VARCHAR(50) NOT NULL DEFAULT 'SAGA',
  UNIQUE KEY unique_año_sistema (año, sistema_juego),  
  INDEX idx_activa (activa),
  INDEX idx_año (año)
)

CREATE TABLE elo_jugadores (
  id INT PRIMARY KEY AUTO_INCREMENT,
  jugador_id INT NOT NULL COMMENT 'Referencia a torneos.jugadores(id)',
  temporada_id INT NOT NULL,
  sistema_juego VARCHAR(50) NOT NULL DEFAULT 'SAGA',
  elo_actual INT DEFAULT 1500,
  elo_maximo INT DEFAULT 1500,
  elo_minimo INT DEFAULT 1500,
  partidas_jugadas INT DEFAULT 0,
  victorias INT DEFAULT 0,
  derrotas INT DEFAULT 0,
  empates INT DEFAULT 0,
  warlords_muertos INT DEFAULT 0,
  ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (temporada_id) REFERENCES temporadas(id) ON DELETE CASCADE,
  UNIQUE KEY unique_jugador_temporada_sistema (jugador_id, temporada_id, sistema_juego),
  INDEX idx_sistema_juego (sistema_juego),
  INDEX idx_jugador (jugador_id),
  INDEX idx_temporada (temporada_id),
  INDEX idx_elo_actual (elo_actual)
) ;

CREATE TABLE elo_historial (
  id INT PRIMARY KEY AUTO_INCREMENT,
  jugador_id INT NOT NULL COMMENT 'Referencia a torneos.jugadores(id)',
  temporada_id INT NOT NULL,
  sistema_juego VARCHAR(50) NOT NULL DEFAULT 'SAGA',
  partida_id INT NOT NULL COMMENT 'Referencia a torneos.partidas(id)',
  torneo_id INT NOT NULL COMMENT 'Referencia a torneos.torneos(id)',
  elo_anterior INT NOT NULL,
  elo_nuevo INT NOT NULL,
  cambio INT NOT NULL,
  oponente_id INT NOT NULL COMMENT 'Referencia a torneos.jugadores(id)',
  oponente_elo INT NOT NULL,
  resultado ENUM('victoria', 'derrota', 'empate') NOT NULL,
  epoca VARCHAR(100) NULL,
  faccion VARCHAR(100) NULL,
  warlord_muerto BOOLEAN DEFAULT FALSE,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (temporada_id) REFERENCES temporadas(id) ON DELETE CASCADE,
  INDEX idx_jugador_temporada (jugador_id, temporada_id),
  INDEX idx_sistema_juego (sistema_juego),
   INDEX idx_partida_sistema (partida_id, sistema_juego),
  INDEX idx_partida (partida_id),
  INDEX idx_torneo (torneo_id),
  INDEX idx_fecha (fecha)
);

CREATE TABLE estadisticas_temporada (
  id INT PRIMARY KEY AUTO_INCREMENT,
  jugador_id INT NOT NULL COMMENT 'Referencia a torneos.jugadores(id)',
  temporada_id INT NOT NULL,
  torneos_participados INT DEFAULT 0,
  mejor_posicion INT,
  peor_posicion INT,
  puntos_totales_anotados INT DEFAULT 0,
  puntos_totales_recibidos INT DEFAULT 0,
  racha_actual INT DEFAULT 0,
  mejor_racha INT DEFAULT 0,
  FOREIGN KEY (temporada_id) REFERENCES temporadas(id) ON DELETE CASCADE,
  UNIQUE KEY unique_jugador_temporada_stats (jugador_id, temporada_id),
  INDEX idx_jugador (jugador_id)
);

CREATE TABLE mapeo_participaciones (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sistema_juego VARCHAR(50) NOT NULL,
  participacion_id INT NOT NULL COMMENT 'ID de jugador_torneo_X',
  jugador_id INT NOT NULL COMMENT 'ID de usuarios',
  torneo_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_sistema_participacion (sistema_juego, participacion_id),
  INDEX idx_jugador (jugador_id),
  INDEX idx_sistema (sistema_juego)
);

CREATE TABLE estadisticas_jugador (
  id INT PRIMARY KEY AUTO_INCREMENT,
  jugador_id INT NOT NULL,
  temporada_id INT NOT NULL,
  sistema_juego VARCHAR(50) NOT NULL,
  
  -- Estadísticas generales
  torneos_participados INT DEFAULT 0,
  torneos_ganados INT DEFAULT 0,
  
  -- Estadísticas SAGA específicas
  epoca_favorita VARCHAR(100) NULL,
  faccion_favorita VARCHAR(100) NULL,
  epocas_jugadas JSON NULL COMMENT 'Contador de épocas: {"vikingos": 5, "cruzadas": 3}',
  facciones_jugadas JSON NULL COMMENT 'Contador de facciones: {"normandos": 5, "sajones": 3}',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (temporada_id) REFERENCES temporadas(id) ON DELETE CASCADE,
  UNIQUE KEY unique_jugador_temporada_sistema (jugador_id, temporada_id, sistema_juego),
  INDEX idx_sistema (sistema_juego),
  INDEX idx_temporada (temporada_id)
) ;