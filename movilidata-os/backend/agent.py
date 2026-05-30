import re, json, random
from datetime import datetime, timedelta
from collections import Counter, defaultdict
from sqlalchemy import func, create_engine
from sqlalchemy.orm import sessionmaker

DB_URL = 'sqlite:///./movilidata.db'

class MovilidataAgent:
    def __init__(self, db_url=None):
        self.engine = create_engine(db_url or DB_URL, connect_args={"check_same_thread": False})
        self.Session = sessionmaker(bind=self.engine)
        self.knowledge_base = self._build_knowledge_base()

    def _get_session(self):
        return self.Session()

    def _build_knowledge_base(self):
        try:
            from models import Accident, ZonaRiesgo, SegmentoVial, CondicionClimatica, Alerta
            s = self._get_session()
            kb = {}

            total_acc = s.query(Accident).count()
            kb['total_accidentes'] = total_acc

            top_comunas = s.query(
                Accident.comuna, func.count(Accident.id).label('total')
            ).group_by(Accident.comuna).order_by(func.count(Accident.id).desc()).limit(10).all()
            kb['top_comunas'] = [(c.comuna, c.total) for c in top_comunas]

            severidad = s.query(
                Accident.gravedad, func.count(Accident.id).label('total')
            ).group_by(Accident.gravedad).all()
            kb['severidad'] = {str(sv.gravedad): sv.total for sv in severidad}

            tipos = s.query(
                Accident.tipo, func.count(Accident.id).label('total')
            ).group_by(Accident.tipo).order_by(func.count(Accident.id).desc()).all()
            kb['tipos'] = [(t.tipo, t.total) for t in tipos]

            total_victimas = s.query(func.sum(Accident.victimas)).scalar() or 0
            kb['total_victimas'] = total_victimas

            zonas = s.query(ZonaRiesgo).order_by(ZonaRiesgo.indice_riesgo.desc()).limit(10).all()
            kb['zonas_riesgo'] = [(z.nombre_sector, z.indice_riesgo, z.n_accidentes) for z in zonas]

            segmentos = s.query(SegmentoVial).all()
            if segmentos:
                velocidades = [seg.velocidad_actual for seg in segmentos if seg.velocidad_actual]
                kb['velocidad_promedio'] = round(sum(velocidades) / len(velocidades), 1) if velocidades else 0
                kb['vias_congestionadas'] = sum(1 for seg in segmentos if seg.color_congestion == 'red')
                kb['total_vias'] = len(segmentos)
            else:
                kb['velocidad_promedio'] = 0
                kb['vias_congestionadas'] = 0
                kb['total_vias'] = 0

            weather = s.query(CondicionClimatica).order_by(CondicionClimatica.timestamp.desc()).first()
            if weather:
                kb['clima'] = {
                    'intensidad': weather.intensidad_label,
                    'precipitacion': weather.precipitacion_mmh,
                    'temperatura': getattr(weather, 'temperature', 0) or 0
                }
            else:
                kb['clima'] = {'intensidad': 'sin datos', 'precipitacion': 0, 'temperatura': 0}

            alertas_activas = s.query(Alerta).filter(Alerta.activa == True).count()
            kb['alertas_activas'] = alertas_activas

            s.close()
            return kb
        except Exception as e:
            print(f"[Agent] Error building KB: {e}")
            return {}

    def refresh(self):
        self.knowledge_base = self._build_knowledge_base()

    def _match_intent(self, question):
        q = question.lower()

        intents = {
            'accidentes_total': r'\b(total|cuantos|cantidad|n.mero)\b.*\b(accident|siniestro|incident)\b',
            'accidentes_tipo': r'\b(tipo|clase|categor.a)\b.*\b(accident|incident|choque|atropello)\b',
            'accidentes_comuna': r'\b(comuna|sector|zona|barrio|d.nde|cu.l)\b.*\b(m.s|mayor|cr.tico|peligro|accident)\b',
            'accidentes_gravedad': r'\b(grave|leve|moderado|muerto|fatal|herido|severidad|gravedad)\b',
            'accidentes_tendencia': r'\b(tendencia|evoluci.n|cambio|aument|disminu|mes|año)\b',
            'trafico_ahora': r'\b(tr.fico|congesti.n|tr.nsito|v.as|vía|call)\b.*\b(ahora|actual|momento|estado)\b',
            'trafico_velocidad': r'\b(velocidad|r.pido|lento|km/h|promedio)\b',
            'trafico_congestion': r'\b(congestion|atasc|tranc|demora|retraso|taco)\b',
            'clima_ahora': r'\b(clima|lluvia|precipitaci.n|temperatura|tiempo|SIATA)\b',
            'ruta_segura': r'\b(ruta|camino|viaje|recorrido|trayecto|segur)\b',
            'alerta_activa': r'\b(alerta|aviso|notificaci.n|peligro|advertencia)\b',
            'zona_riesgo': r'\b(riesgo|peligro|cr.tico|insegur|evitar|peligros|peligros)\w*\b',
            'ranking_accidentes': r'\b(ranking|top|mayor|peor|m.s peligro)\w*\b.*\b(comuna|zona|sector|accident)\b',
            'recomendar': r'\b(recomend|consejo|sugerencia|qu. hacer|deb.)\b',
            'saludar': r'\b(hola|buen|salud|gracias|ayuda|qué tal)\b'
        }

        for intent, pattern in intents.items():
            if re.search(pattern, q):
                return intent
        return 'general'

    def _responder_accidentes_total(self):
        kb = self.knowledge_base
        total = kb.get('total_accidentes', 0)
        victimas = kb.get('total_victimas', 0)
        return (
            f"En Medellín se han registrado {total:,} accidentes en el último año, "
            f"con un total de {victimas:,} víctimas. "
            f"Fuente: Medata / Observatorio de Movilidad de Medellín."
        )

    def _responder_accidentes_tipo(self):
        tipos = self.knowledge_base.get('tipos', [])
        if not tipos:
            return "No hay datos de tipos de accidentes disponibles."
        lineas = '\n'.join([f"  • {t}: {c} casos" for t, c in tipos[:5]])
        return (
            f"Distribución de accidentes por tipo:\n{lineas}\n"
            f"Fuente: Medata."
        )

    def _responder_accidentes_comuna(self):
        comunas = self.knowledge_base.get('top_comunas', [])
        if not comunas:
            return "No hay datos de comunas disponibles."
        lineas = '\n'.join([f"  {i+1}. {c}: {t} accidentes" for i, (c, t) in enumerate(comunas[:5])])
        riesgo = self.knowledge_base.get('zonas_riesgo', [])
        riesgo_lineas = '\n'.join([f"  • {z}: IR {r:.2f} ({n} accidentes)" for z, r, n in riesgo[:3]]) if riesgo else "  Sin datos de riesgo."
        return (
            f"Top comunas con más accidentes:\n{lineas}\n\n"
            f"Zonas de mayor riesgo:\n{riesgo_lineas}\n\n"
            f"Fuente: Medata."
        )

    def _responder_accidentes_gravedad(self):
        severidad = self.knowledge_base.get('severidad', {})
        if not severidad:
            return "No hay datos de gravedad disponibles."
        mapa = {'1': 'Leve', '2': 'Moderado', '3': 'Grave'}
        lineas = '\n'.join([f"  • {mapa.get(k, k)}: {v} casos" for k, v in sorted(severidad.items())])
        return (
            f"Distribución por gravedad:\n{lineas}\n"
            f"Fuente: Medata."
        )

    def _responder_trafico_ahora(self):
        kb = self.knowledge_base
        vias = kb.get('total_vias', 0)
        velocidad = kb.get('velocidad_promedio', 0)
        congestionadas = kb.get('vias_congestionadas', 0)
        estado = 'congestión crítica' if congestionadas > 5 else ('congestión moderada' if congestionadas > 2 else 'flujo normal')
        return (
            f"Estado del tráfico actual en Medellín:\n"
            f"  • {vias} vías monitoreadas\n"
            f"  • Velocidad promedio: {velocidad} km/h\n"
            f"  • Vías congestionadas: {congestionadas}\n"
            f"  • Estado general: {estado}\n"
            f"Fuente: SIM / Observatorio de Movilidad."
        )

    def _responder_clima_ahora(self):
        clima = self.knowledge_base.get('clima', {})
        intensidad = clima.get('intensidad', 'sin datos')
        precip = clima.get('precipitacion', 0)
        temp = clima.get('temperatura', 0)
        advertencia = ''
        if precip > 8:
            advertencia = '\n  ⚠️ Precaución: lluvia intensa. Evita zonas inundables.'
        elif precip > 2:
            advertencia = '\n  🌧️ Lluvia moderada. Conduce con cuidado.'
        return (
            f"Condiciones climáticas actuales en Medellín:\n"
            f"  • Intensidad: {intensidad}\n"
            f"  • Precipitación: {precip} mm/h\n"
            f"  • Temperatura: {temp}°C{advertencia}\n"
            f"Fuente: SIATA."
        )

    def _responder_alerta_activa(self):
        alertas = self.knowledge_base.get('alertas_activas', 0)
        if alertas == 0:
            return "✅ No hay alertas activas en este momento. La movilidad está en condiciones normales."
        return (
            f"⚠️ Hay {alertas} alerta(s) activas en el sistema.\n"
            f"Revisa el panel de alertas para más detalles.\n"
            f"Fuente: Sistema de monitoreo Movilidata OS."
        )

    def _responder_zona_riesgo(self):
        zonas = self.knowledge_base.get('zonas_riesgo', [])
        if not zonas:
            return "No hay datos de zonas de riesgo disponibles."
        lineas = '\n'.join([
            f"  {i+1}. {z}: IR {r:.2f} ({n} accidentes)" +
            (' ⚠️ CRÍTICO' if r > 0.7 else '')
            for i, (z, r, n) in enumerate(zonas[:5])
        ])
        return (
            f"Ranking de zonas críticas por índice de riesgo:\n{lineas}\n\n"
            f"IR (Índice de Riesgo) > 0.7 es crítico. Fuente: Medata."
        )

    def _responder_ruta_segura(self):
        return (
            "Para calcular una ruta segura:\n"
            "  1. Ve al módulo Rutas Seguras\n"
            "  2. Ingresa tu origen y destino en coordenadas\n"
            "  3. El sistema trazará una ruta evitando zonas de alto riesgo\n\n"
            "Recomendación: En época de lluvias, evita las zonas con historial de inundaciones "
            "y reduce la velocidad en las comunas con mayor índice de accidentalidad."
        )

    def _responder_saludar(self):
        return (
            "¡Hola! Soy el asistente de movilidad de Medellín Movilidata OS 🚗\n\n"
            "Puedo ayudarte con:\n"
            "  • Estadísticas de accidentes viales\n"
            "  • Estado del tráfico en tiempo real\n"
            "  • Condiciones climáticas actuales\n"
            "  • Alertas activas en la ciudad\n"
            "  • Zonas de riesgo y rutas seguras\n\n"
            "¿Qué deseas consultar?"
        )

    def _responder_general(self):
        kb = self.knowledge_base
        total = kb.get('total_accidentes', 0)
        velocidad = kb.get('velocidad_promedio', 0)
        clima = kb.get('clima', {})
        alertas = kb.get('alertas_activas', 0)
        return (
            f"Resumen de movilidad en Medellín:\n\n"
            f"🚗 Tráfico: {kb.get('total_vias', 0)} vías monitoreadas, velocidad promedio {velocidad} km/h, "
            f"{kb.get('vias_congestionadas', 0)} congestionadas.\n"
            f"🚦 Accidentes: {total:,} registrados en el último año.\n"
            f"🌧️ Clima: {clima.get('intensidad', 'sin datos')} ({clima.get('precipitacion', 0)} mm/h).\n"
            f"⚠️ Alertas: {alertas} activa(s).\n\n"
            f"Puedes preguntarme por temas específicos como accidentes por comuna, "
            f"tráfico actual, rutas seguras, o condiciones climáticas. "
            f"Fuentes: Medata, SIATA, SIM, Observatorio de Movilidad."
        )

    def answer(self, question):
        self.refresh()
        intent = self._match_intent(question)
        responders = {
            'accidentes_total': self._responder_accidentes_total,
            'accidentes_tipo': self._responder_accidentes_tipo,
            'accidentes_comuna': self._responder_accidentes_comuna,
            'accidentes_gravedad': self._responder_accidentes_gravedad,
            'ranking_accidentes': self._responder_accidentes_comuna,
            'trafico_ahora': self._responder_trafico_ahora,
            'trafico_velocidad': self._responder_trafico_ahora,
            'trafico_congestion': self._responder_trafico_ahora,
            'clima_ahora': self._responder_clima_ahora,
            'alerta_activa': self._responder_alerta_activa,
            'zona_riesgo': self._responder_zona_riesgo,
            'accidentes_tendencia': self._responder_accidentes_total,
            'ruta_segura': self._responder_ruta_segura,
            'recomendar': self._responder_ruta_segura,
            'saludar': self._responder_saludar,
            'general': self._responder_general,
        }
        responder = responders.get(intent, self._responder_general)
        respuesta = responder()
        return {
            'respuesta': respuesta,
            'intent': intent,
            'proveedor': 'agente_local_movilidata',
            'timestamp': datetime.utcnow().isoformat()
        }

agent = MovilidataAgent()

def get_agent():
    return agent
