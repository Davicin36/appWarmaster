import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from 'react-i18next';

import { torneosSagaApi } from '@/servicios/apiSaga';
import { usuarioApi } from '@/servicios/apiUsuarios';
import {
    PUNTOS_BANDA_RANGO,
    procesarEpocasYBandas,
    obtenerConfiguracionBanda,
    permiteTipoTropa,
    obtenerOpcionesWarlordLegendario,
    obtenerInfoCompletaWarlord,
    calcularPuntosDisponibles,
    validarComposicionBanda,
    useSagaI18n,
} from '../funcionesSaga/constantesFuncionesSaga';
import Footer from '@/paginas/Footer.jsx';
import '@/estilos/inscripcionesEquipo.css';

// Estado inicial de un miembro
const miembroVacio = (overrides = {}) => ({
    nombre: "", email: "", epoca: "", banda: "",
    warlordSeleccionado: null,
    puntos: { guardias:0, guerreros:0, levas:0, mercenarios:0, elefantes:0, carros:0, tambor:0, curaids:0, perros:0, berserkers:0, cerdos:0 },
    unidadesEspeciales: {}, opcionesBanda: {}, tiposTropaPersonalizados: {},
    detalleMercenarios: "", esCapitan: false, esYo: false, usuarioValido: null,
    ...overrides,
});

function InscripcionSagaEquipos({ torneoId, torneo, user }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();
    const { getEpoca, getTropa, getBanda, traducirTiposT, traducirOpciones } = useSagaI18n();
    const modoEdicion = location.pathname.includes('editar-inscripcion');

    const [nombreEquipo,   setNombreEquipo]   = useState("");
    const [equipoId,       setEquipoId]       = useState(null);
    const [miembrosEquipo, setMiembrosEquipo] = useState([
        miembroVacio({ nombre: `${user?.nombre} ${user?.apellidos}`, email: user?.email, esCapitan: true, esYo: true, usuarioValido: true }),
    ]);
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState("");

    const jugadoresPorEquipo = torneo?.num_jugadores_equipo;
    const puntosMaximos      = torneo?.puntos_banda || PUNTOS_BANDA_RANGO.default;
    const { epocasArray, todasLasBandas, mapaBandaAEpoca } = React.useMemo(
        () => procesarEpocasYBandas(torneo?.epocas_disponibles), [torneo?.epocas_disponibles]
    );

    // Cargar equipo en modo edicion
    useEffect(() => {
        const cargarEquipo = async () => {
            if (!modoEdicion) return;
            try {
                setLoading(true);
                const data = await torneosSagaApi.obtenerInscripcionEquipo(torneoId);
                if (data.success && data.data) {
                    const equipo = data.data;
                    setNombreEquipo(equipo.nombre_equipo || "");
                    setEquipoId(equipo.id);
                    if (equipo.miembros && Array.isArray(equipo.miembros)) {
                        setMiembrosEquipo(equipo.miembros.map(m => {
                            let c = {};
                            try { 
                              c = typeof m.composicion_ejercito === 'string' ? JSON.parse(m.composicion_ejercito) : (m.composicion_ejercito || {}); 
                            } catch{
                              console.log(`Error parsing composicion_ejercito for member ${m.nombre}:`, m.composicion_ejercito);
                            }
                            return {
                                nombre: m.nombre, email: m.email, epoca: m.epoca, banda: m.banda || "",
                                warlordSeleccionado: c.warlordLegendario?.valor || null,
                                puntos: { guardias:parseFloat(c.guardias||0), guerreros:parseFloat(c.guerreros||0), levas:parseFloat(c.levas||0), mercenarios:parseFloat(c.mercenarios||0), elefantes:parseFloat(c.elefantes||0), carros:parseFloat(c.carros||0), tambor:parseFloat(c.tambor||0), curaids:parseFloat(c.curaids||0), perros:parseFloat(c.perros||0), berserkers:parseFloat(c.berserkers||0), cerdos:parseFloat(c.cerdos||0) },
                                unidadesEspeciales: c.unidadesEspeciales||{}, opcionesBanda: c.opcionesBanda||{}, tiposTropaPersonalizados: c.tiposTropaPersonalizados||{},
                                detalleMercenarios: c.detalleMercenarios||"", esCapitan: m.es_capitan,
                                esYo: m.usuario_id===user.id, usuarioValido: m.estado_cuenta==='activo', estadoCuenta: m.estado_cuenta,
                            };
                        }));
                    }
                }
            } catch { setError(t('insc_equipo.err_carga_equipo')); }
            finally { setLoading(false); }
        };
        cargarEquipo();
    }, [modoEdicion, torneoId, user.id]);

    // Handlers
    const agregarMiembro = () => {
        if (miembrosEquipo.length < jugadoresPorEquipo) { setMiembrosEquipo([...miembrosEquipo, miembroVacio()]); setError(""); }
        else setError(t('insc_equipo.err_max_jugadores', { n: jugadoresPorEquipo }));
    };

    const eliminarMiembro = (idx) => {
        if (miembrosEquipo[idx].esYo) { setError(t('insc_equipo.err_no_eliminarte')); return; }
        if (miembrosEquipo.length > 1) { setMiembrosEquipo(miembrosEquipo.filter((_,i)=>i!==idx)); setError(""); }
    };

    const eliminarInscripcionEquipo = async () => {
        if (!window.confirm(t('insc_equipo.confirm_eliminar'))) return;
        if (!equipoId) { setError(t('insc_equipo.err_sin_id_equipo')); return; }
        try {
            setLoading(true);
            const r = await torneosSagaApi.eliminarEquipoTorneo(torneoId, equipoId);
            if (r.success) { alert(`✅ ${t('insc_equipo.exito_eliminar')}`); navigate('/'); }
        } catch(err) { setError(err.message || t('insc_equipo.err_eliminar')); }
        finally { setLoading(false); }
    };

    const actualizarMiembro = (idx, campo, valor) => {
        const m = [...miembrosEquipo];
        m[idx][campo] = valor;
        if (campo==='epoca') {
            m[idx].banda=""; m[idx].warlordSeleccionado=null;
            m[idx].puntos={guardias:0,guerreros:0,levas:0,mercenarios:0,elefantes:0,carros:0,tambor:0,curaids:0,perros:0,berserkers:0,cerdos:0};
            m[idx].unidadesEspeciales={}; m[idx].opcionesBanda={}; m[idx].tiposTropaPersonalizados={}; m[idx].detalleMercenarios="";
        }
        if (campo==='banda') {
            m[idx].warlordSeleccionado=null;
            if (!valor) {
                m[idx].puntos={guardias:0,guerreros:0,levas:0,mercenarios:0,elefantes:0,carros:0,tambor:0,curaids:0,perros:0,berserkers:0,cerdos:0};
                m[idx].unidadesEspeciales={}; m[idx].opcionesBanda={}; m[idx].tiposTropaPersonalizados={}; m[idx].detalleMercenarios="";
            } else {
                const c = obtenerConfiguracionBanda(valor);
                const p = {...m[idx].puntos};
                if(!c.permiteElefantes) p.elefantes=0; if(!c.permiteCarros) p.carros=0;
                if(!c.permiteTambor) p.tambor=0; if(!c.permiteCuraids) p.curaids=0;
                if(!c.permitePerros) p.perros=0; if(!c.permiteBerserkers) p.berserkers=0;
                if(!permiteTipoTropa(c,'guardias')) p.guardias=0;
                if(!permiteTipoTropa(c,'guerreros')) p.guerreros=0;
                if(!permiteTipoTropa(c,'levas')) p.levas=0;
                if(!permiteTipoTropa(c,'mercenarios')) { p.mercenarios=0; m[idx].detalleMercenarios=""; }
                if(c.epoca!=='Anibal') p.cerdos=0;
                m[idx].puntos=p;
                if(!c.unidadesEspeciales?.length) m[idx].unidadesEspeciales={};
                if(!c.tiposTropaPersonalizados) m[idx].tiposTropaPersonalizados={};
                if(c.opcionesBanda?.length>0) { const d={}; c.opcionesBanda.forEach(o=>{d[o.id]=o.porDefecto||'';}); m[idx].opcionesBanda=d; }
                else m[idx].opcionesBanda={};
            }
        }
        if(campo==='email') m[idx].usuarioValido=null;
        setMiembrosEquipo(m);
    };

    const actualizarWarlord = (idx, valor) => {
        const m=[...miembrosEquipo]; const vf=valor||null;
        m[idx].warlordSeleccionado=vf;
        if(vf){
            const info=obtenerInfoCompletaWarlord(m[idx].epoca,m[idx].banda,vf);
            if(info.restricciones.prohibido.length>0){
                const p={...m[idx].puntos}; let cambios=false;
                info.restricciones.prohibido.forEach(tipo=>{if(p[tipo]>0){p[tipo]=0;cambios=true;}});
                if(cambios){m[idx].puntos=p; setTimeout(()=>alert(`⚠️ ${t('insc_equipo.aviso_reset_warlord',{nombre:m[idx].nombre})}`),100);}
            }
        }
        setMiembrosEquipo(m);
    };

    const actualizarPuntos = (idx,tipo,val) => { const m=[...miembrosEquipo]; m[idx].puntos[tipo]=parseFloat(val)||0; if(tipo==='mercenarios'&&parseFloat(val)===0) m[idx].detalleMercenarios=""; setMiembrosEquipo(m); };
    const actualizarUnidadEspecial=(idx,k,val)=>{const m=[...miembrosEquipo];m[idx].unidadesEspeciales[k]=parseFloat(val)||0;setMiembrosEquipo(m);};
    const actualizarOpcionBanda=(idx,id,val)=>{const m=[...miembrosEquipo];m[idx].opcionesBanda[id]=val;setMiembrosEquipo(m);};
    const actualizarTropaPersonalizada=(idx,id,val)=>{const m=[...miembrosEquipo];m[idx].tiposTropaPersonalizados[id]=parseFloat(val)||0;setMiembrosEquipo(m);};
    const marcarComoCapitan=(idx)=>setMiembrosEquipo(miembrosEquipo.map((m,i)=>({...m,esCapitan:i===idx})));

    const verificarUsuario=async(email,idx)=>{
        if(!email?.includes('@')) return;
        try {
            const r=await usuarioApi.verificarUsuario(email);
            if(r.existe&&r.usuario){if(!miembrosEquipo[idx].nombre.trim()) actualizarMiembro(idx,'nombre',`${r.usuario.nombre} ${r.usuario.apellidos||''}`); actualizarMiembro(idx,'usuarioValido',true);}
            else{actualizarMiembro(idx,'usuarioValido',false); if(modoEdicion) setError(t('insc_equipo.err_usuario_no_registrado_edicion',{email}));}
        } catch{actualizarMiembro(idx,'usuarioValido',false);}
    };

    // Calculo de puntos
    const calcularTotalPuntos=(m)=>{
        const c=m.banda?obtenerConfiguracionBanda(m.banda):null;
        if(c?.tiposTropaPersonalizados){let t=0;Object.keys(m.tiposTropaPersonalizados).forEach(id=>{const can=m.tiposTropaPersonalizados[id];const tc=c.tiposTropaPersonalizados.find(x=>x.id===id);if(tc)t+=can*tc.puntos;});return t;}
        const esp=Object.values(m.unidadesEspeciales||{}).reduce((a,v)=>a+v,0);
        return m.puntos.guardias+m.puntos.guerreros+m.puntos.levas+m.puntos.mercenarios+m.puntos.elefantes+m.puntos.carros+m.puntos.tambor+m.puntos.curaids+m.puntos.perros+m.puntos.berserkers+m.puntos.cerdos+esp;
    };
    const calcularPuntosMaximosMiembro=(m)=>(!m.banda||!m.epoca)?puntosMaximos:calcularPuntosDisponibles(puntosMaximos,m.epoca,m.banda,m.warlordSeleccionado);
    const validarPuntosMiembro=(m)=>Math.abs(calcularTotalPuntos(m)-calcularPuntosMaximosMiembro(m))<0.01;

    const construirDatosMiembro=(m)=>{
        const d={nombre:m.nombre.trim(),email:m.email.toLowerCase().trim(),epoca:m.epoca,banda:m.banda||null,esCapitan:m.esCapitan};
        if(m.banda){
            const c=obtenerConfiguracionBanda(m.banda);
            if(m.warlordSeleccionado){const ow=obtenerOpcionesWarlordLegendario(m.epoca,m.banda);const op=ow?.opciones.find(o=>o.valor===m.warlordSeleccionado);if(op)d.warlordLegendario={valor:m.warlordSeleccionado,nombre:op.nombre,costePuntos:op.costePuntos,bandaDesbloqueada:op.bandaDesbloqueada||null};}
            if(c.tiposTropaPersonalizados){d.tiposTropaPersonalizados=m.tiposTropaPersonalizados;}
            else{d.puntos={};['guardias','guerreros','levas','mercenarios','elefantes','carros','tambor','curaids','perros','berserkers','cerdos'].forEach(k=>{if(m.puntos[k]>0)d.puntos[k]=m.puntos[k];});if(Object.keys(m.unidadesEspeciales||{}).length>0)d.unidadesEspeciales=m.unidadesEspeciales;}
            if(Object.keys(m.opcionesBanda||{}).length>0)d.opcionesBanda=m.opcionesBanda;
            if(m.detalleMercenarios?.trim())d.detalleMercenarios=m.detalleMercenarios;
        }
        return d;
    };

    // Submit
    const handleSubmit=async(e)=>{
        e.preventDefault(); setError("");
        if(!nombreEquipo.trim()){setError(t('insc_equipo.val_nombre_equipo'));return;}
        if(!jugadoresPorEquipo){setError(t('insc_equipo.err_sin_config_jugadores'));return;}
        const mv=miembrosEquipo.filter(m=>m.nombre.trim()&&m.email.trim()&&m.epoca);
        if(mv.length!==jugadoresPorEquipo){setError(t('insc_equipo.val_num_jugadores',{n:jugadoresPorEquipo,actual:mv.length}));return;}
        const mc=mv.filter(m=>m.banda?.trim());
        const mp=mc.filter(m=>!validarPuntosMiembro(m));
        if(mp.length>0){setError(t('insc_equipo.val_puntos_incorrectos',{nombres:mp.map(m=>m.nombre).join(', ')}));return;}
        for(const m of mc){const c=obtenerConfiguracionBanda(m.banda);if(c.opcionesBanda?.length>0){for(const o of c.opcionesBanda){if(o.obligatorio&&!m.opcionesBanda[o.id]){setError(t('insc_equipo.val_opcion_banda',{nombre:m.nombre,opcion:o.label}));return;}}}}
        for(const m of mc){if(m.warlordSeleccionado){const info=obtenerInfoCompletaWarlord(m.epoca,m.banda,m.warlordSeleccionado);const comp={elefantes:m.puntos.elefantes,carros:m.puntos.carros,levas:m.puntos.levas,guardias:m.puntos.guardias,guerreros:m.puntos.guerreros,mercenarios:m.puntos.mercenarios};const v=validarComposicionBanda(comp,info.restricciones);if(!v.valido){setError(t('insc_equipo.val_restricciones_warlord',{nombre:m.nombre,errores:v.errores.join(', ')}));return;}}}
        for(const m of mv){if(m.banda&&m.puntos.mercenarios>0&&!m.detalleMercenarios.trim()){setError(t('insc_equipo.val_detalle_mercenarios',{nombre:m.nombre}));return;}}
        const emails=mv.map(m=>m.email.toLowerCase());
        if(new Set(emails).size!==emails.length){setError(t('insc_equipo.val_emails_duplicados'));return;}
        if(!mv.some(m=>m.esCapitan)){setError(t('insc_equipo.val_capitan'));return;}
        try{
            setLoading(true);
            const misDatos=mv.find(m=>m.esYo);
            if(!misDatos){setError(t('insc_equipo.err_sin_datos_propios'));return;}
            const otros=mv.filter(m=>!m.esYo);
            const conEmail=otros.filter(m=>m.email?.trim());
            const ins={nombreEquipo:nombreEquipo.trim(),miembros:modoEdicion?mv.map(construirDatosMiembro):otros.map(construirDatosMiembro)};
            if(!modoEdicion){
                const md=construirDatosMiembro(misDatos);ins.miEpoca=misDatos.epoca;ins.miBanda=misDatos.banda||null;
                if(misDatos.banda){const c=obtenerConfiguracionBanda(misDatos.banda);if(c.tiposTropaPersonalizados){ins.misTiposTropaPersonalizados=misDatos.tiposTropaPersonalizados;}else{ins.misPuntos=md.puntos;if(md.unidadesEspeciales)ins.misUnidadesEspeciales=md.unidadesEspeciales;}if(md.opcionesBanda)ins.misOpcionesBanda=md.opcionesBanda;if(md.detalleMercenarios)ins.miDetalleMercenarios=md.detalleMercenarios;if(md.warlordLegendario)ins.miWarlordLegendario=md.warlordLegendario;}
            }
            let r;
            if(modoEdicion){r=await torneosSagaApi.actualizarInscripcionEquipos(torneoId,ins);alert(`✅ ${t('insc_equipo.exito_actualizar')}`);}
            else{
              r=await torneosSagaApi.IncripcionEquipo(torneoId,ins);if(conEmail.length>0){alert(`✅ ${t('insc_equipo.exito_inscribir')}\n\n📧 ${t('insc_equipo.exito_emails_enviados',{n:conEmail.length})}\n${conEmail.map(m=>`• ${m.nombre} (${m.email})`).join('\n')}\n\n${t('insc_equipo.exito_instrucciones')}`);}else{alert(`✅ ${t('insc_equipo.exito_inscribir')}`);}
            }
            if(r.success)navigate('/');
        }catch(err){setError(err.message||t('insc_equipo.err_procesar'));}
        finally{setLoading(false);}
    };

    // Render
    return (
        <div className="inscripcion-container">
            <h1>{modoEdicion?`✏️ ${t('insc_equipo.titulo_editar')}` : `👥 ${t('insc_equipo.titulo_inscribir')}`}: {torneo?.nombre_torneo}</h1>
            <div className="info-message info-equipos">ℹ️ {t('insc_equipo.info_puntos')}</div>
            <div className="info-message info-invitaciones" style={{backgroundColor:'#e0f2fe',borderLeft:'4px solid #0284c7',marginTop:'1rem'}}>
                📧 {t('insc_equipo.info_invitaciones')}
            </div>
            <form onSubmit={handleSubmit} className="inscripcion-form">
                {error&&<div className="error-message">⚠️ {error}</div>}
                <div className="form-group">
                    <label htmlFor="nombreEquipo">{t('insc_equipo.nombre_equipo')} *</label>
                    <input type="text" id="nombreEquipo" value={nombreEquipo} onChange={(e)=>setNombreEquipo(e.target.value)} placeholder={t('insc_equipo.nombre_equipo_placeholder')} required disabled={loading} maxLength={50}/>
                </div>
                <section className="miembros-section">
                    <div className="miembros-header">
                        <h3>{t('insc_equipo.jugadores')} ({miembrosEquipo.length}/{jugadoresPorEquipo})</h3>
                        {miembrosEquipo.length<jugadoresPorEquipo&&<button type="button" onClick={agregarMiembro} className="btn-agregar" disabled={loading}>➕ {t('botones.añadir')}</button>}
                    </div>
                    <div className="miembros-lista">
                        {miembrosEquipo.map((miembro,index)=>{
                            const cfg=miembro.banda?obtenerConfiguracionBanda(miembro.banda):null;
                            const bandas=miembro.epoca?todasLasBandas.filter(b=>mapaBandaAEpoca[b.nombre]===miembro.epoca):[];
                            const opWarlord=miembro.banda&&miembro.epoca&&torneo?.unidades_legendarias===1?obtenerOpcionesWarlordLegendario(miembro.epoca,miembro.banda):null;
                            const infoW=miembro.banda&&miembro.epoca?obtenerInfoCompletaWarlord(miembro.epoca,miembro.banda,miembro.warlordSeleccionado):{tieneWarlord:false,costePuntos:0,restricciones:{prohibido:[],mutuamenteExcluyentes:[]},unidadesDesbloqueadas:[]};
                            const pMax=calcularPuntosMaximosMiembro(miembro);
                            const total=calcularTotalPuntos(miembro);
                            const ok=Math.abs(total-pMax)<0.01;
                            const pfE=cfg?.permiteElefantes||false,pfC=cfg?.permiteCarros||false,pfT=cfg?.permiteTambor||false,pfCu=cfg?.permiteCuraids||false,pfP=cfg?.permitePerros||false,pfB=cfg?.permiteBerserkers||false;
                            const tieneOpc=cfg?.opcionesBanda?.length>0;
                            const usaP=!!cfg?.tiposTropaPersonalizados;
                            const pfGd=permiteTipoTropa(cfg||{},'guardias'),pfGr=permiteTipoTropa(cfg||{},'guerreros'),pfL=permiteTipoTropa(cfg||{},'levas'),pfM=permiteTipoTropa(cfg||{},'mercenarios');
                            const pfCe=cfg?.epoca==='Anibal'&&torneo?.unidades_legendarias===1;
                            const uniEsp=(()=>{const b=cfg?.unidadesEspeciales||[];const d=infoW.unidadesDesbloqueadas||[];const t=[...b];d.forEach(u=>{if(!t.find(x=>x.nombre===u.nombre))t.push({...u,desbloquedaPorWarlord:true});});return t;})();
                            const opcBandaTrad=traducirOpciones(cfg?.opcionesBanda);
                            const tiposTrad=traducirTiposT(cfg?.tiposTropaPersonalizados);
                            return (
                                <div key={index} className="miembro-item">
                                    <div className="miembro-header-row">
                                        <div className="miembro-numero">{miembro.esYo?`👤 ${t('insc_equipo.tu')}` : `${t('insc_equipo.jugador')} ${index+1}`}</div>
                                        <button type="button" onClick={()=>marcarComoCapitan(index)} className={`btn-capitan ${miembro.esCapitan?'activo':''}`} disabled={loading}>
                                            {miembro.esCapitan?`👑 ${t('insc_equipo.capitan')}`:t('insc_equipo.hacer_capitan')}
                                        </button>
                                    </div>
                                    <div className="miembro-campos">
                                        {/* NOMBRE */}
                                        <div className="form-group">
                                            <label htmlFor={`nombre-${index}`}>{t('insc_equipo.nombre')} *</label>
                                            <input type="text" id={`nombre-${index}`} value={miembro.nombre} onChange={(e)=>actualizarMiembro(index,'nombre',e.target.value)} required disabled={loading||miembro.esYo} placeholder={t('insc_equipo.nombre_placeholder')}/>
                                        </div>
                                        {/* EMAIL */}
                                        <div className="form-group">
                                            <label htmlFor={`email-${index}`}>{t('registro.email')} *</label>
                                            <div className="input-con-badge">
                                                <input type="email" id={`email-${index}`} value={miembro.email} onChange={(e)=>actualizarMiembro(index,'email',e.target.value)} onBlur={()=>!miembro.esYo&&verificarUsuario(miembro.email,index)} required disabled={loading||miembro.esYo} placeholder={t('registro.email_placeholder')} className={miembro.usuarioValido===false&&modoEdicion?'input-error':miembro.usuarioValido===true?'input-success':''}/>
                                                {!miembro.esYo&&miembro.estadoCuenta==='pendiente_registro'&&<span className="badge-registro pendiente">⏳ {t('insc_equipo.pendiente_registro')}</span>}
                                                {!miembro.esYo&&miembro.estadoCuenta==='activo'&&<span className="badge-registro registrado">✅ {t('insc_equipo.registrado')}</span>}
                                            </div>
                                            {!miembro.esYo&&miembro.usuarioValido===false&&miembro.email&&!modoEdicion&&<small style={{color:'#0284c7',fontSize:'0.85rem',marginTop:'0.25rem',display:'block',fontWeight:'500'}}>📧 {t('insc_equipo.info_email_pendiente')}</small>}
                                        </div>
                                        {/* EPOCA */}
                                        <div className="form-group">
                                            <label htmlFor={`epoca-${index}`}>{t('insc_equipo.epoca')} * <span style={{fontSize:'0.85rem',color:'#666',marginLeft:'0.5rem'}}>({t('insc_equipo.disponible',{count:epocasArray.length})})</span></label>
                                            <select id={`epoca-${index}`} value={miembro.epoca} onChange={(e)=>actualizarMiembro(index,'epoca',e.target.value)} required disabled={loading}>
                                                <option value="">{t('insc_equipo.selecciona_epoca')}</option>
                                                {epocasArray.map((e,i)=><option key={i} value={e}>{getEpoca(e)}</option>)}
                                            </select>
                                        </div>
                                        {/* BANDA */}
                                        {miembro.epoca&&<div className="form-group">
                                            <label htmlFor={`banda-${index}`}>{t('insc_equipo.banda_opcional')} <span style={{fontSize:'0.85rem',color:'#666',marginLeft:'0.5rem'}}>({t('insc_equipo.disponible',{count:bandas.length})})</span></label>
                                            <select id={`banda-${index}`} value={miembro.banda} onChange={(e)=>actualizarMiembro(index,'banda',e.target.value)} disabled={loading}>
                                                <option value="">{t('insc_equipo.selecciona_banda')}</option>
                                                {bandas.map((b,i)=><option key={i} value={b.nombre}>{getBanda(b.nombre)}</option>)}
                                            </select>
                                        </div>}
                                        {/* WARLORD */}
                                        {miembro.banda&&opWarlord&&torneo?.unidades_legendarias===1&&<div className="warlord-section">
                                            <h4>⚔️ {t('insc_equipo.warlord_titulo')}</h4>
                                            <div className="form-group">
                                                <label htmlFor={`warlord-${index}`}>{t('insc_equipo.warlord_label')}{opWarlord.obligatorio&&<span style={{color:'red'}}> *</span>}</label>
                                                <select id={`warlord-${index}`} value={miembro.warlordSeleccionado||''} onChange={(e)=>actualizarWarlord(index,e.target.value||null)} disabled={loading} required={opWarlord.obligatorio}>
                                                    <option value="">{t('insc_equipo.sin_warlord')}</option>
                                                    {opWarlord.opciones.map(o=><option key={o.valor} value={o.valor}>{o.nombreCompleto}{o.tieneBandaDesbloqueada&&` → ${o.bandaDesbloqueada}`}</option>)}
                                                </select>
                                            </div>
                                            {infoW.tieneWarlord&&<div className="info-warlord">
                                                <p className="info-line"><strong>{t('insc_equipo.warlord_nombre')}:</strong> {infoW.nombreWarlord}</p>
                                                <p className="info-line"><strong>{t('insc_equipo.warlord_coste')}:</strong> {infoW.costePuntos} {infoW.costePuntos===1?t('insc_equipo.punto'):t('insc_equipo.puntos')}</p>
                                                {infoW.tieneBandaDesbloqueada&&<p className="info-line banda-desbloqueada">✨ <strong>{t('insc_equipo.banda_desbloqueada')}:</strong> {infoW.nombreBandaFinal}</p>}
                                                <p className="info-line"><strong>{t('insc_equipo.puntos_disponibles')}:</strong> {pMax}<small className="puntos-detalle-small"> ({puntosMaximos} - {infoW.costePuntos})</small></p>
                                                {infoW.restricciones.prohibido.length>0&&<div className="restriccion-prohibido"><strong>⛔ {t('insc_equipo.prohibido')}:</strong> {infoW.restricciones.prohibido.map(p=>getTropa(p)).join(', ')}</div>}
                                                {infoW.unidadesDesbloqueadas?.length>0&&<div className="unidades-desbloqueadas"><strong>✨ {t('insc_equipo.unidades_desbloqueadas')}:</strong><ul className="lista-unidades-desbloqueadas">{infoW.unidadesDesbloqueadas.map((u,i)=><li key={i}>{u.label||u.nombre}</li>)}</ul></div>}
                                            </div>}
                                        </div>}
                                        {/* OPCIONES BANDA */}
                                        {miembro.banda&&tieneOpc&&<div className="opciones-banda-mini">
                                            <h4>{t('insc_equipo.config_banda')}</h4>
                                            {opcBandaTrad.map(o=><div key={o.id} className="form-group">
                                                <label htmlFor={`${o.id}-${index}`}>{o.label}{o.obligatorio&&<span style={{color:'red'}}> *</span>}</label>
                                                {o.tipo==='select'&&<select id={`${o.id}-${index}`} value={miembro.opcionesBanda[o.id]||''} onChange={(e)=>actualizarOpcionBanda(index,o.id,e.target.value)} disabled={loading} required={o.obligatorio}><option value="">{t('insc_equipo.seleccionar')}</option>{o.opciones.map(opt=><option key={opt.valor} value={opt.valor}>{opt.nombre}</option>)}</select>}
                                            </div>)}
                                        </div>}
                                        {/* PUNTOS */}
                                        {miembro.banda&&<div className="puntos-banda-section">
                                            <h4>{t('insc_equipo.distribucion_puntos')}</h4>
                                            <p className="puntos-info">
                                                {t('insc_equipo.total')}: <strong>{total.toFixed(1)}</strong> / {pMax}
                                                {miembro.warlordSeleccionado&&infoW.costePuntos>0&&<small className="puntos-detalle-small"> ({puntosMaximos} - {infoW.costePuntos} warlord)</small>}
                                                {!ok&&<span className="puntos-error">{total<pMax?` ⚠️ ${t('insc_equipo.faltan',{n:(pMax-total).toFixed(1)})}`:`⚠️ ${t('insc_equipo.excede',{n:(total-pMax).toFixed(1)})}`}</span>}
                                                {ok&&<span className="puntos-ok"> ✅</span>}
                                            </p>
                                            <div className="puntos-grid-mini">
                                                {usaP?tiposTrad.map(tipo=><div key={tipo.id} className="punto-item-mini"><label htmlFor={`${tipo.id}-${index}`}>{tipo.label}<small style={{fontSize:'0.75rem',color:'#666',padding:'0.25rem'}}>({tipo.puntos} {t('insc_equipo.pts_cada')})</small></label><input type="number" inputMode="decimal" id={`${tipo.id}-${index}`} value={miembro.tiposTropaPersonalizados[tipo.id]||0} onChange={(e)=>actualizarTropaPersonalizada(index,tipo.id,e.target.value)} min="0" max={pMax} step={tipo.step||0.5} disabled={loading}/></div>):(
                                                    <>
                                                    {pfGd&&
                                                        <div className="punto-item-mini">
                                                            <label htmlFor={`guardias-${index}`}>{getTropa('guardias')}</label>
                                                            <input 
                                                                type="number" 
                                                                inputMode="decimal" id={`guardias-${index}`} 
                                                                value={miembro.puntos.guardias} 
                                                                onChange={(e)=>actualizarPuntos(index,'guardias',e.target.value)} 
                                                                min="0" 
                                                                max={pMax} 
                                                                step="0.5" 
                                                                disabled={loading}
                                                            />
                                                        </div>}
                                                    {pfB&&
                                                        <div className="punto-item-mini">
                                                            <label htmlFor={`berserkers-${index}`}>{getTropa('berserkers')}</label>
                                                            <input
                                                                type="number" 
                                                                inputMode="decimal" id={`berserkers-${index}`} 
                                                                value={miembro.puntos.berserkers} onChange={(e)=>actualizarPuntos(index,'berserkers',e.target.value)} 
                                                                min="0" 
                                                                max={pMax} 
                                                                step="1" 
                                                                disabled={loading}
                                                            />
                                                        </div>}
                                                    {pfCe&&<div className="punto-item-mini cerdos-legendario"><label htmlFor={`cerdos-${index}`}>🐷 {t('insc_equipo.cerdos_incendiarios')}</label><input type="number" inputMode="decimal" id={`cerdos-${index}`} value={miembro.puntos.cerdos} onChange={(e)=>actualizarPuntos(index,'cerdos',e.target.value)} min="0" max="1" step="1" disabled={loading}/></div>}
                                                    {pfE&&<div className="punto-item-mini"><label htmlFor={`elefantes-${index}`}>{getTropa('elefantes')}</label><input type="number" inputMode="decimal" id={`elefantes-${index}`} value={miembro.puntos.elefantes} onChange={(e)=>actualizarPuntos(index,'elefantes',e.target.value)} min="0" max={pMax} step="1" disabled={loading}/></div>}
                                                    {pfC&&<div className="punto-item-mini"><label htmlFor={`carros-${index}`}>{getTropa('carros')}</label><input type="number" inputMode="decimal" id={`carros-${index}`} value={miembro.puntos.carros} onChange={(e)=>actualizarPuntos(index,'carros',e.target.value)} min="0" max={pMax} step="1" disabled={loading}/></div>}
                                                    {pfT&&<div className="punto-item-mini"><label htmlFor={`tambor-${index}`}>{getTropa('tambor')}</label><input type="number" inputMode="decimal" id={`tambor-${index}`} value={miembro.puntos.tambor} onChange={(e)=>actualizarPuntos(index,'tambor',e.target.value)} min="0" max={pMax} step="1" disabled={loading}/></div>}
                                                    {pfCu&&<div className="punto-item-mini"><label htmlFor={`curaids-${index}`}>{getTropa('curaids')}</label><input type="number" inputMode="decimal" id={`curaids-${index}`} value={miembro.puntos.curaids} onChange={(e)=>actualizarPuntos(index,'curaids',e.target.value)} min="0" max={pMax} step="0.5" disabled={loading}/></div>}
                                                    {pfP&&<div className="punto-item-mini"><label htmlFor={`perros-${index}`}>{getTropa('perros')}</label><input type="number" inputMode="decimal" id={`perros-${index}`} value={miembro.puntos.perros} onChange={(e)=>actualizarPuntos(index,'perros',e.target.value)} min="0" max={pMax} step="0.5" disabled={loading}/></div>}
                                                    {uniEsp.map(u=>{const k=u.valor||u.nombre;return(
                                                        <div key={k} className={`punto-item-mini ${u.desbloquedaPorWarlord?'unidad-warlord':''}`}>
                                                            <label htmlFor={`${k}-${index}`}>{u.desbloquedaPorWarlord&&'✨ '}{getTropa(u.nombre) !== u.nombre ? getTropa(u.nombre) : u.label}
                                                                <small style={{fontSize:'0.75rem',color:'#666',padding:'0.25rem'}}>({u.puntos} {t('insc_equipo.pts_cada')})</small>
                                                            </label>
                                                            <input 
                                                            type="number" 
                                                            inputMode="decimal" 
                                                            id={`${k}-${index}`} 
                                                            value={miembro.unidadesEspeciales[k]||0} 
                                                            onChange={(e)=>actualizarUnidadEspecial(index,k,e.target.value)} 
                                                            min="0" 
                                                            max={pMax} 
                                                            step={u.step||0.5} 
                                                            disabled={loading}
                                                        />
                                                    </div>);})}
                                                    {pfGr&&<div className="punto-item-mini"><label htmlFor={`guerreros-${index}`}>{getTropa('guerreros')}</label><input type="number" inputMode="decimal" id={`guerreros-${index}`} value={miembro.puntos.guerreros} onChange={(e)=>actualizarPuntos(index,'guerreros',e.target.value)} min="0" max={pMax} step="0.5" disabled={loading}/></div>}
                                                    {pfL&&<div className="punto-item-mini"><label htmlFor={`levas-${index}`}>{getTropa('levas')}</label><input type="number" inputMode="decimal" id={`levas-${index}`} value={miembro.puntos.levas} onChange={(e)=>actualizarPuntos(index,'levas',e.target.value)} min="0" max={pMax} step="0.5" disabled={loading}/></div>}
                                                    {pfM&&<div className="punto-item-mini"><label htmlFor={`mercenarios-${index}`}>{getTropa('mercenarios')}</label><input type="number" inputMode="decimal" id={`mercenarios-${index}`} value={miembro.puntos.mercenarios} onChange={(e)=>actualizarPuntos(index,'mercenarios',e.target.value)} min="0" max={pMax} step="0.5" disabled={loading}/></div>}
                                                    </>
                                                )}
                                            </div>
                                            {miembro.puntos.mercenarios>0&&pfM&&!usaP&&<div className="form-group"><label htmlFor={`detalle-merc-${index}`}>{t('insc_equipo.detalle_mercenarios')} *</label><textarea id={`detalle-merc-${index}`} value={miembro.detalleMercenarios} onChange={(e)=>actualizarMiembro(index,'detalleMercenarios',e.target.value)} placeholder={t('insc_equipo.detalle_mercenarios_placeholder')} rows="2" required disabled={loading}/></div>}
                                        </div>}
                                    </div>
                                    {!miembro.esYo&&<button type="button" onClick={()=>eliminarMiembro(index)} className="btn-eliminar" disabled={loading} title={t('botones.eliminar')}>🗑️</button>}
                                </div>
                            );
                        })}
                    </div>
                </section>
                <div className="button-group">
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading?`⏳ ${t('insc_equipo.procesando')}`:modoEdicion?`✅ ${t('insc_equipo.btn_guardar')}` : `✅ ${t('insc_equipo.btn_inscribir')}`}
                    </button>
                    {modoEdicion&&<button type="button" className="btn-danger" onClick={eliminarInscripcionEquipo} disabled={loading}>🗑️ {t('insc_equipo.btn_eliminar_insc')}</button>}
                    <button type="button" className="btn-secondary" onClick={()=>navigate(-1)} disabled={loading}>{t('botones.cancelar')}</button>
                </div>
            </form>
            <Footer/>
        </div>
    );
}

export default InscripcionSagaEquipos;