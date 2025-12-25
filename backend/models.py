from sqlalchemy import Column, Integer, String, DateTime, JSON
from database import Base
import datetime

class TrafficLog(Base):
    __tablename__ = "traffic_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    total_vehicles = Column(Integer)
    density_status = Column(String)
    vehicle_breakdown = Column(JSON) # Store dict as JSON
    alert_type = Column(String, nullable=True)
    snapshot_path = Column(String, nullable=True) # Path to saved image if alert

class Settings(Base):
    __tablename__ = "settings"
    
    key = Column(String, primary_key=True)
    value = Column(String)
