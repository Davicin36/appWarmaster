import React, { useState } from 'react';
import apiAdministrador from '@/servicios/apiAdmin.js';


import {
    EPOCAS_SAGA,
    TIPOS_PARTIDA_SAGA,
} from '@/componentesSaga/funcionesSaga/constantesFuncionesSaga.js';

import './estilosAdmin/editarTorneosModal.css';

const EditarTorneoModal = ({ torneo, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    nombre_torneo: torneo.nombre_torneo || '',
    sistema: torneo.sistema || 'SAGA',
    tipo_torneo: torneo.tipo_torneo || 'Individual',
    num_jugadores_equipo: torneo.num_jugadores_equipo || 3,
    rondas_max: torneo.rondas_max || 3,
    ronda_actual: torneo.ronda_actual || 1,
    fecha_inicio: torneo.fecha_inicio ? torneo.fecha_inicio.split('T')[0] : '',
    fecha_fin: torneo.fecha_fin ? torneo.fecha_fin.split('T')[0] : '',
    ubicacion: torneo.ubicacion || '',
    puntos_banda: torneo.puntos_banda || 6,
    puntos_ejercito: torneo.puntos_ejercito || 2000,
    participantes_max: torneo.participantes_max || 32,
    equipos_max: torneo.equipos_max || 10,
    estado: torneo.estado || 'pendiente',
    partida_ronda_1: torneo.partida_ronda_1 || '',
    partida_ronda_2: torneo.partida_ronda_2 || '',
    partida_ronda_3: torneo.partida_ronda_3 || '',
    partida_ronda_4: torneo.partida_ronda_4 || '',
    partida_ronda_5: torneo.partida_ronda_5 || ''
  });

  const [epocas, setEpocas] = useState(torneo.epocas_disponibles || []);
  const [nuevaEpoca, setNuevaEpoca] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [eliminarPdf, setEliminarPdf] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAgregarEpoca = () => {
    if (nuevaEpoca && !epocas.includes(nuevaEpoca)) {
      setEpocas(prev => [...prev, nuevaEpoca]);
      setNuevaEpoca('');
    }
  };

  const handleEliminarEpoca = (epoca) => {
    setEpocas(prev => prev.filter(e => e !== epoca));
  };

  const handlePdfChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Solo se permiten archivos PDF');
        return;
      }
      if (file.size > 16 * 1024 * 1024) {
        alert('El archivo no puede superar los 16MB');
        return;
      }
      setPdfFile(file);
      setEliminarPdf(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formDataToSend = new FormData();

      // Añadir campos básicos
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Añadir épocas si es SAGA
      if (formData.sistema === 'SAGA' && epocas.length > 0) {
        formDataToSend.append('epocas_disponibles', JSON.stringify(epocas));
      }

      // Añadir PDF si se seleccionó uno nuevo
      if (pdfFile) {
        formDataToSend.append('bases_pdf', pdfFile);
      }

      // Marcar si se debe eliminar el PDF
      if (eliminarPdf) {
        formDataToSend.append('eliminar_pdf', 'true');
      }

      await apiAdministrador.actualizarTorneo(torneo.id, formDataToSend);

      alert('✅ Torneo actualizado correctamente');
      onSuccess();
    } catch (error) {
      console.error('Error al actualizar torneo:', error);
      const errorMsg = error.message || 'Error desconocido';
      setError(`Error al actualizar: ${errorMsg}`);
      alert(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>✏️ Editar Torneo</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="alert-error">{error}</div>}

          {/* Información Básica */}
          <div className="form-section">
            <h3>📋 Información Básica</h3>

            <div className="form-group">
              <label>Nombre del Torneo *</label>
              <input
                type="text"
                name="nombre_torneo"
                value={formData.nombre_torneo}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Sistema *</label>
                <select
                  name="sistema"
                  value={formData.sistema}
                  onChange={handleChange}
                  required
                  disabled
                >
                  <option value="SAGA">SAGA</option>
                  <option value="WARMASTER">WARMASTER</option>
                  <option value="FOW">Flames of War</option>
                  <option value="BOLT">Bolt Action</option>
                </select>
                <small>⚠️ No se puede cambiar el sistema</small>
              </div>

              <div className="form-group">
                <label>Tipo de Torneo *</label>
                <select
                  name="tipo_torneo"
                  value={formData.tipo_torneo}
                  onChange={handleChange}
                  required
                >
                  <option value="Individual">Individual</option>
                  <option value="Por equipos">Por Equipos</option>
                </select>
              </div>
            </div>

            {formData.tipo_torneo === 'Por equipos' && (
              <div className="form-group">
                <label>Jugadores por Equipo</label>
                <input
                  type="number"
                  name="num_jugadores_equipo"
                  value={formData.num_jugadores_equipo}
                  onChange={handleChange}
                  min="2"
                  max="6"
                />
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>Estado *</label>
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  required
                >
                  <option value="pendiente">⏳ Pendiente</option>
                  <option value="en_curso">🎮 En Curso</option>
                  <option value="finalizado">✅ Finalizado</option>
                </select>
              </div>

              <div className="form-group">
                <label>Ubicación</label>
                <input
                  type="text"
                  name="ubicacion"
                  value={formData.ubicacion}
                  onChange={handleChange}
                  placeholder="Ciudad, Local..."
                />
              </div>
            </div>
          </div>

          {/* Fechas */}
          <div className="form-section">
            <h3>📅 Fechas</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Fecha de Inicio *</label>
                <input
                  type="date"
                  name="fecha_inicio"
                  value={formData.fecha_inicio}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Fecha de Fin</label>
                <input
                  type="date"
                  name="fecha_fin"
                  value={formData.fecha_fin}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Rondas */}
          <div className="form-section">
            <h3>🎯 Rondas</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Rondas Totales *</label>
                <input
                  type="number"
                  name="rondas_max"
                  value={formData.rondas_max}
                  onChange={handleChange}
                  min="2"
                  max="5"
                  required
                />
              </div>

              <div className="form-group">
                <label>Ronda Actual</label>
                <input
                  type="number"
                  name="ronda_actual"
                  value={formData.ronda_actual}
                  onChange={handleChange}
                  min="1"
                  max={formData.rondas_max}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Partida Ronda 1 *</label>
              <input
                type="text"
                name="partida_ronda_1"
                value={formData.partida_ronda_1}
                onChange={handleChange}
                placeholder="Ej: Conquista, Saqueo..."
                required
              />
            </div>

            <div className="form-group">
              <label>Partida Ronda 2 *</label>
              <input
                type="text"
                name="partida_ronda_2"
                value={formData.partida_ronda_2}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Partida Ronda 3 *</label>
              <input
                type="text"
                name="partida_ronda_3"
                value={formData.partida_ronda_3}
                onChange={handleChange}
                required
              />
            </div>

            {formData.rondas_max >= 4 && (
              <div className="form-group">
                <label>Partida Ronda 4</label>
                <input
                  type="text"
                  name="partida_ronda_4"
                  value={formData.partida_ronda_4}
                  onChange={handleChange}
                />
              </div>
            )}

            {formData.rondas_max >= 5 && (
              <div className="form-group">
                <label>Partida Ronda 5</label>
                <input
                  type="text"
                  name="partida_ronda_5"
                  value={formData.partida_ronda_5}
                  onChange={handleChange}
                />
              </div>
            )}
          </div>

          {/* Puntos y Participantes */}
          <div className="form-section">
            <h3>⚔️ Puntos y Participantes</h3>

            <div className="form-row">
              {formData.sistema === 'SAGA' && (
                <div className="form-group">
                  <label>Puntos de Banda *</label>
                  <input
                    type="number"
                    name="puntos_banda"
                    value={formData.puntos_banda}
                    onChange={handleChange}
                    min="4"
                    max="8"
                    required
                  />
                </div>
              )}

              {(formData.sistema === 'WARMASTER' || formData.sistema === 'FOW') && (
                <div className="form-group">
                  <label>Puntos de Ejército *</label>
                  <input
                    type="number"
                    name="puntos_ejercito"
                    value={formData.puntos_ejercito}
                    onChange={handleChange}
                    min="1000"
                    max="3000"
                    step="100"
                    required
                  />
                </div>
              )}

              {formData.tipo_torneo === 'Individual' ? (
                <div className="form-group">
                  <label>Participantes Máximo *</label>
                  <input
                    type="number"
                    name="participantes_max"
                    value={formData.participantes_max}
                    onChange={handleChange}
                    min="4"
                    max="100"
                    required
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label>Equipos Máximo *</label>
                  <input
                    type="number"
                    name="equipos_max"
                    value={formData.equipos_max}
                    onChange={handleChange}
                    min="5"
                    max="20"
                    required
                  />
                </div>
              )}
            </div>
          </div>

          {/* Épocas (solo SAGA) */}
          {formData.sistema === 'SAGA' && (
            <div className="form-section">
              <h3>🗓️ Épocas Disponibles</h3>

              <div className="epocas-selector">
                <select
                  value={nuevaEpoca}
                  onChange={(e) => setNuevaEpoca(e.target.value)}
                >
                  <option value="">-- Seleccionar época --</option>
                  {EPOCAS_SAGA
                    .filter(e => !epocas.includes(e))
                    .map(epoca => (
                      <option key={epoca} value={epoca}>{epoca}</option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={handleAgregarEpoca}
                  disabled={!nuevaEpoca}
                  className="btn-add-epoca"
                >
                  + Añadir
                </button>
              </div>

              <div className="epocas-list">
                {epocas.map(epoca => (
                  <span key={epoca} className="epoca-tag">
                    {epoca}
                    <button
                      type="button"
                      onClick={() => handleEliminarEpoca(epoca)}
                      className="btn-remove-epoca"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>

              {epocas.length === 0 && (
                <p className="alert-warning">⚠️ Debes añadir al menos una época</p>
              )}
            </div>
          )}

          {/* Bases PDF */}
          <div className="form-section">
            <h3>📄 Bases del Torneo (PDF)</h3>

            {torneo.bases_nombre && !eliminarPdf && !pdfFile && (
              <div className="pdf-actual">
                <span>📄 Archivo actual: {torneo.bases_nombre}</span>
                <button
                  type="button"
                  onClick={() => setEliminarPdf(true)}
                  className="btn-eliminar-pdf"
                >
                  🗑️ Eliminar PDF
                </button>
              </div>
            )}

            {eliminarPdf && (
              <div className="alert-warning">
                ⚠️ El PDF será eliminado al guardar
                <button
                  type="button"
                  onClick={() => setEliminarPdf(false)}
                  className="btn-cancelar-eliminar"
                >
                  Cancelar
                </button>
              </div>
            )}

            <div className="form-group">
              <label>Subir nuevo PDF (opcional)</label>
              <input
                type="file"
                accept=".pdf"
                onChange={handlePdfChange}
              />
              {pdfFile && (
                <small className="file-selected">
                  ✅ Archivo seleccionado: {pdfFile.name}
                </small>
              )}
            </div>
          </div>

          {/* Botones */}
          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn-cancelar"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-guardar"
              disabled={loading || (formData.sistema === 'SAGA' && epocas.length === 0)}
            >
              {loading ? '⏳ Guardando...' : '💾 Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditarTorneoModal;