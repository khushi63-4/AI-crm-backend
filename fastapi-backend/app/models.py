from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, text
from .config import Base

class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=False)
    city = Column(String(100), nullable=True)
    occupation = Column(String(100), nullable=True)
    investment_amount = Column(Numeric(15, 2), nullable=True)
    call_output = Column(String(50), nullable=True, server_default="DNP")
    lead_source = Column(String(100), nullable=False, server_default="Manual")
    created_at = Column(
        DateTime, 
        nullable=False, 
        server_default=text("CURRENT_TIMESTAMP")
    )

class FacebookConfig(Base):
    __tablename__ = "facebook_configs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    access_token = Column(Text, nullable=True)
    page_id = Column(String(100), nullable=True)
    verify_token = Column(String(255), nullable=True)
    public_webhook_url = Column(String(255), nullable=True)
    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")
    )
