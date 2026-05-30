from abc import ABC, abstractmethod
from typing import Optional, Any
from dataclasses import dataclass, field
from datetime import datetime
import logging

logger = logging.getLogger('movilidata.providers')

@dataclass
class ProviderStatus:
    name: str
    source_type: str
    status: str = 'unknown'
    last_success: Optional[datetime] = None
    last_error: Optional[datetime] = None
    error_count: int = 0
    consecutive_errors: int = 0
    avg_response_time_ms: float = 0.0
    response_samples: int = 0

    def record_success(self, response_time_ms: float):
        self.status = 'ok'
        self.last_success = datetime.utcnow()
        self.consecutive_errors = 0
        self.avg_response_time_ms = (
            (self.avg_response_time_ms * self.response_samples + response_time_ms)
            / (self.response_samples + 1)
        )
        self.response_samples += 1

    def record_error(self, response_time_ms: float):
        self.status = 'degraded'
        self.last_error = datetime.utcnow()
        self.error_count += 1
        self.consecutive_errors += 1
        self.avg_response_time_ms = (
            (self.avg_response_time_ms * self.response_samples + response_time_ms)
            / (self.response_samples + 1)
        )
        self.response_samples += 1

    @property
    def healthy(self):
        return self.consecutive_errors < 3

    @property
    def to_dict(self):
        return {
            'name': self.name,
            'source_type': self.source_type,
            'status': self.status,
            'last_success': self.last_success.isoformat() if self.last_success else None,
            'last_error': self.last_error.isoformat() if self.last_error else None,
            'error_count': self.error_count,
            'consecutive_errors': self.consecutive_errors,
            'avg_response_time_ms': round(self.avg_response_time_ms, 1),
            'healthy': self.healthy
        }

class BaseProvider(ABC):
    def __init__(self, name: str, source_type: str):
        self.name = name
        self.status = ProviderStatus(name=name, source_type=source_type)

    @abstractmethod
    def fetch(self, **params) -> Any:
        pass

    def get(self, **params) -> Any:
        import time
        start = time.perf_counter()
        try:
            result = self.fetch(**params)
            elapsed = (time.perf_counter() - start) * 1000
            self.status.record_success(elapsed)
            return result
        except Exception as e:
            elapsed = (time.perf_counter() - start) * 1000
            self.status.record_error(elapsed)
            logger.warning(f"[Provider:{self.name}] Error tras {elapsed:.0f}ms: {e}")
            raise

    @property
    def provider_info(self):
        return self.status.to_dict

    def _validate_coords(self, lat: float, lon: float) -> bool:
        return 4.5 <= lat <= 6.5 and -76 <= lon <= -75

    def _validate_speed(self, speed: float) -> bool:
        return 0 <= speed <= 120

    def _validate_future_date(self, date_str: str) -> bool:
        from datetime import datetime
        try:
            dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            return dt <= datetime.utcnow()
        except:
            return False
