from datetime import datetime
from typing import Any, List, Tuple
import logging

logger = logging.getLogger('movilidata.validation')

class ValidationWarning(Exception):
    def __init__(self, message: str, field: str, value: Any):
        self.field = field
        self.value = value
        super().__init__(message)

MEDELLIN_LAT_MIN, MEDELLIN_LAT_MAX = 6.0, 6.5
MEDELLIN_LON_MIN, MEDELLIN_LON_MAX = -75.7, -75.5
SPEED_MIN, SPEED_MAX = 0, 120
TEMPERATURE_MIN, TEMPERATURE_MAX = 5, 45
PRECIP_MIN, PRECIP_MAX = 0, 200
VICTIMAS_MAX = 50

def validate_coordinates(lat: float, lon: float, strict: bool = True) -> bool:
    ok = MEDELLIN_LAT_MIN <= lat <= MEDELLIN_LAT_MAX and MEDELLIN_LON_MIN <= lon <= MEDELLIN_LON_MAX
    if not ok and strict:
        raise ValidationWarning(
            f'Coordenadas fuera de Medellín: lat={lat}, lon={lon}',
            'coords', (lat, lon)
        )
    return ok

def validate_speed(speed: float, strict: bool = True) -> bool:
    if speed is None:
        return True
    ok = SPEED_MIN <= speed <= SPEED_MAX
    if not ok and strict:
        raise ValidationWarning(
            f'Velocidad irreal: {speed} km/h (rango {SPEED_MIN}-{SPEED_MAX})',
            'speed', speed
        )
    return ok

def validate_future_date(date_str: str, strict: bool = True) -> bool:
    if not date_str:
        return False
    try:
        if 'T' in date_str or ' ' in date_str:
            dt = datetime.fromisoformat(date_str.replace('Z', '+00:00').replace(' ', 'T'))
        else:
            dt = datetime.strptime(date_str, '%Y-%m-%d')
        ok = dt <= datetime.utcnow()
        if not ok and strict:
            raise ValidationWarning(f'Fecha futura: {date_str}', 'date', date_str)
        return ok
    except ValidationWarning:
        raise
    except:
        return False

def validate_null(value: Any, field: str, default: Any = None) -> Any:
    if value is None or (isinstance(value, float) and value != value):
        logger.warning(f'[Validation] Valor nulo en {field}, usando default={default}')
        return default
    return value

def validate_precipitation(mmh: float, strict: bool = True) -> bool:
    if mmh is None:
        return True
    ok = PRECIP_MIN <= mmh <= PRECIP_MAX
    if not ok and strict:
        raise ValidationWarning(
            f'Precipitación irreal: {mmh} mm/h (rango {PRECIP_MIN}-{PRECIP_MAX})',
            'precipitation', mmh
        )
    return ok

def validate_victimas(count: int, strict: bool = True) -> bool:
    ok = 0 <= count <= VICTIMAS_MAX
    if not ok and strict:
        raise ValidationWarning(
            f'Número de víctimas irreal: {count}',
            'victimas', count
        )
    return ok

def validate_temperature(temp: float, strict: bool = True) -> bool:
    if temp is None:
        return True
    ok = TEMPERATURE_MIN <= temp <= TEMPERATURE_MAX
    if not ok and strict:
        raise ValidationWarning(
            f'Temperatura fuera de rango: {temp}°C (esperado {TEMPERATURE_MIN}-{TEMPERATURE_MAX})',
            'temperature', temp
        )
    return ok

def validate_ingestion_row(row: dict, validators: List[Tuple[str, callable]]) -> List[str]:
    warnings = []
    for field, validator_fn in validators:
        value = row.get(field)
        try:
            validator_fn(value)
        except ValidationWarning as e:
            warnings.append(str(e))
            logger.warning(f'[Validation] {e}')
        except Exception as e:
            warnings.append(f'Error validando {field}={value}: {e}')
    return warnings

def safe_get(row: dict, field: str, default=None, validator=None):
    value = row.get(field, default)
    if validator and value is not None:
        try:
            validator(value, strict=False)
        except:
            return default
    return value if value is not None else default
