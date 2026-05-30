from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Accident(Base):
    __tablename__ = 'accidents'
    id = Column(Integer, primary_key=True)
    fecha = Column(String, index=True)
    tipo = Column(String)
    gravedad = Column(Integer)
    lat = Column(Float, index=True)
    lon = Column(Float, index=True)
    comuna = Column(String)
    victimas = Column(Integer)
    fuente = Column(String)
