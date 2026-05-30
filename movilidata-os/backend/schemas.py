from pydantic import BaseModel, Field, validator
from typing import Optional
import re

class CoordinatesModel(BaseModel):
    lat: float = Field(..., ge=4.5, le=6.5, description='Latitud de Medellín')
    lon: float = Field(..., ge=-76, le=-75, description='Longitud de Medellín')

    @validator('lat', 'lon', pre=True)
    def validate_numbers(cls, v):
        if not isinstance(v, (int, float)):
            raise ValueError('Debe ser un número')
        return float(v)


class RouteRequestModel(BaseModel):
    origen: CoordinatesModel
    destino: CoordinatesModel

    class Config:
        schema_extra = {
            'example': {
                'origen': {'lat': 6.2445, 'lon': -75.6012},
                'destino': {'lat': 6.2603, 'lon': -75.5772}
            }
        }


class AssistantRequestModel(BaseModel):
    pregunta: str = Field(..., min_length=1, max_length=1000)

    @validator('pregunta')
    def sanitize_question(cls, v):
        # Prevenir inyecciones de prompt
        dangerous_patterns = [
            r'ignore.*instruction',
            r'forget.*prompt',
            r'system.*prompt',
            r'execute.*code',
            r'bypass.*security'
        ]
        for pattern in dangerous_patterns:
            if re.search(pattern, v, re.IGNORECASE):
                raise ValueError('Pregunta contiene patrones no permitidos')
        # Limitar a caracteres alfanuméricos + puntuación básica
        if not re.match(r"^[a-záéíóúñ0-9\s\?¿\.\,\!\¡\-]+$", v, re.IGNORECASE):
            raise ValueError('Pregunta contiene caracteres no permitidos')
        return v.strip()


class ExportRequestModel(BaseModel):
    modulo: str = Field(..., regex='^[a-z_]+$')

    @validator('modulo')
    def validate_modulo(cls, v):
        allowed = ['accidents', 'accidentes', 'traffic', 'trafico', 'alerts', 'alertas', 'prediction']
        if v not in allowed:
            raise ValueError('Módulo no permitido')
        return v
