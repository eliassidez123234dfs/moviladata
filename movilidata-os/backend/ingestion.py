import os
import csv
import random
from datetime import datetime, timedelta
from pathlib import Path

DATA_DIR = Path(__file__).parent / 'data'
DATA_DIR.mkdir(parents=True, exist_ok=True)
ACC_FILE = DATA_DIR / 'accidents_sample.csv'

COMUNAS = [
    'Comuna 1', 'Comuna 2', 'Comuna 3', 'Comuna 4', 'Comuna 5',
    'El Poblado', 'Laureles', 'Belen', 'Centro', 'Robledo'
]

# Bounding box roughly covering Medellín
MIN_LAT, MAX_LAT = 6.12, 6.35
MIN_LON, MAX_LON = -75.65, -75.53

def generate_sample_csv(n=5000):
    if ACC_FILE.exists() and ACC_FILE.stat().st_size > 100:
        return
    print(f"Generating {n} sample accidents to {ACC_FILE}")
    start_date = datetime.now() - timedelta(days=365)
    rows = []
    tipos = ['Choque', 'Atropello', 'Caída', 'Volcamiento']
    for i in range(n):
        dt = start_date + timedelta(seconds=random.randint(0, 365*24*3600))
        lat = round(random.uniform(MIN_LAT, MAX_LAT), 6)
        lon = round(random.uniform(MIN_LON, MAX_LON), 6)
        gravedad = random.choices([1,2,3], weights=[70,25,5])[0]
        victimas = 0 if gravedad==1 else random.randint(1,3)
        fuente = random.choice(['Medata','Observatorio','DatosAbiertos'])
        rows.append({
            'fecha': dt.strftime('%Y-%m-%d %H:%M:%S'),
            'tipo': random.choice(tipos),
            'gravedad': gravedad,
            'lat': lat,
            'lon': lon,
            'comuna': random.choice(COMUNAS),
            'victimas': victimas,
            'fuente': fuente
        })
    # write CSV using csv module to avoid pandas dependency
    with open(ACC_FILE, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['fecha','tipo','gravedad','lat','lon','comuna','victimas','fuente'])
        writer.writeheader()
        for r in rows:
            writer.writerow(r)

def load_accidents_to_db(session, AccidentModel, limit=None):
    generate_sample_csv(5000)
    import csv
    with open(ACC_FILE, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        objs = []
        for i, row in enumerate(reader):
            if limit and i>=limit:
                break
            a = AccidentModel(
                fecha=row['fecha'], tipo=row['tipo'], gravedad=int(row.get('gravedad') or 1),
                lat=float(row['lat']), lon=float(row['lon']), comuna=row.get('comuna'),
                victimas=int(row.get('victimas') or 0), fuente=row.get('fuente')
            )
            objs.append(a)
        session.bulk_save_objects(objs)
        session.commit()
