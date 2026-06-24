import os
import csv
import re
import httpx
import logging
import shutil
from datetime import datetime
from typing import Optional, List
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, Request, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func

from ..config import get_db
from ..models import Lead, FacebookConfig
from ..schemas import LeadCreate, LeadUpdate, LeadResponse, FacebookConfigSchema

router = APIRouter(prefix="/leads", tags=["leads"])

# Configure logging
LOG_FILE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "webhook_debug.log")

def write_log(message: str):
    timestamp = datetime.now().isoformat()
    log_line = f"[{timestamp}] {message}\n"
    try:
        with open(LOG_FILE_PATH, "a", encoding="utf-8") as f:
            f.write(log_line)
    except Exception as e:
        print(f"Failed to write to log file: {str(e)}")
    print(f"[LOG] {message}")

# Helper: Clean phone number to 10 digits
def clean_phone_number(phone_str: str) -> str:
    cleaned = re.sub(r"\D", "", str(phone_str))
    if len(cleaned) >= 10:
        return cleaned[-10:]
    return cleaned if cleaned else "1234567890"

# --- Lead CRUD Endpoints ---

@router.post("/", status_code=201)
def create_lead(lead_in: LeadCreate, db: Session = Depends(get_db)):
    # Validate name
    if not lead_in.name or not lead_in.name.strip():
        raise HTTPException(status_code=400, detail="Name is required")
        
    cleaned_phone = clean_phone_number(lead_in.phone)
    if len(cleaned_phone) != 10:
        raise HTTPException(status_code=400, detail="Phone number must be exactly 10 digits")
        
    db_lead = Lead(
        name=lead_in.name.strip(),
        email=lead_in.email.strip() if lead_in.email else None,
        phone=cleaned_phone,
        city=lead_in.city.strip() if lead_in.city else None,
        occupation=lead_in.occupation.strip() if lead_in.occupation else None,
        investment_amount=lead_in.investment_amount,
        lead_source=lead_in.lead_source or "Manual",
        call_output=lead_in.call_output or "DNP"
    )
    
    try:
        db.add(db_lead)
        db.commit()
        db.refresh(db_lead)
        return {
            "message": "Lead Created Successfully",
            "leadId": db_lead.id
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database Error: {str(e)}")

@router.get("/")
def get_all_leads(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    search: Optional[str] = Query(""),
    lead_source: Optional[str] = Query(""),
    call_output: Optional[str] = Query(""),
    startDate: Optional[str] = Query(""),
    endDate: Optional[str] = Query(""),
    db: Session = Depends(get_db)
):
    offset = (page - 1) * limit
    
    # Base filter criteria
    filters = []
    if search:
        search_like = f"%{search}%"
        filters.append(
            or_(
                Lead.name.like(search_like),
                Lead.email.like(search_like),
                Lead.phone.like(search_like),
                Lead.city.like(search_like),
                Lead.occupation.like(search_like)
            )
        )
    if lead_source:
        filters.append(Lead.lead_source == lead_source)
    if call_output:
        filters.append(Lead.call_output == call_output)
    if startDate and endDate:
        # Date filter equivalent to DATE(created_at) BETWEEN ? AND ?
        filters.append(func.date(Lead.created_at).between(startDate, endDate))
        
    try:
        # Get count
        total = db.query(Lead).filter(*filters).count()
        # Get leads
        leads = db.query(Lead).filter(*filters).order_by(Lead.created_at.desc()).offset(offset).limit(limit).all()
        
        return {
            "total": total,
            "page": page,
            "limit": limit,
            "data": leads
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/export-csv")
def export_leads_csv(
    search: Optional[str] = Query(""),
    lead_source: Optional[str] = Query(""),
    call_output: Optional[str] = Query(""),
    startDate: Optional[str] = Query(""),
    endDate: Optional[str] = Query(""),
    ids: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    import io
    from fastapi.responses import StreamingResponse
    
    filters = []
    
    if ids:
        try:
            id_list = [int(x) for x in ids.split(",") if x.strip()]
            if id_list:
                filters.append(Lead.id.in_(id_list))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid ids parameter format")
            
    if search:
        search_like = f"%{search}%"
        filters.append(
            or_(
                Lead.name.like(search_like),
                Lead.email.like(search_like),
                Lead.phone.like(search_like),
                Lead.city.like(search_like),
                Lead.occupation.like(search_like)
            )
        )
    if lead_source:
        filters.append(Lead.lead_source == lead_source)
    if call_output:
        filters.append(Lead.call_output == call_output)
    if startDate and endDate:
        filters.append(func.date(Lead.created_at).between(startDate, endDate))
        
    try:
        leads = db.query(Lead).filter(*filters).order_by(Lead.created_at.desc()).all()
        
        output = io.StringIO()
        writer = csv.writer(output, lineterminator='\n')
        
        writer.writerow([
            "Name", "Email", "Phone", "City", "Occupation", 
            "Investment Amount", "Call Output", "Lead Source", "Created At"
        ])
        
        for lead in leads:
            writer.writerow([
                lead.name,
                lead.email or "",
                lead.phone,
                lead.city or "",
                lead.occupation or "",
                float(lead.investment_amount) if lead.investment_amount else "",
                lead.call_output or "",
                lead.lead_source,
                lead.created_at.strftime("%Y-%m-%d %H:%M:%S") if lead.created_at else ""
            ])
            
        output.seek(0)
        
        headers = {
            "Content-Disposition": "attachment; filename=leads-export.csv"
        }
        return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers=headers)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{id}")
def get_lead_by_id(id: int, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead Not Found")
    return lead

@router.put("/{id}")
def update_lead(id: int, lead_update: LeadUpdate, db: Session = Depends(get_db)):
    db_lead = db.query(Lead).filter(Lead.id == id).first()
    if not db_lead:
        raise HTTPException(status_code=404, detail="Lead Not Found")
        
    update_dict = lead_update.dict(exclude_unset=True)
    
    if "name" in update_dict:
        if not update_dict["name"] or not update_dict["name"].strip():
            raise HTTPException(status_code=400, detail="Name is required")
        db_lead.name = update_dict["name"].strip()
        
    if "phone" in update_dict:
        cleaned_phone = clean_phone_number(update_dict["phone"])
        if len(cleaned_phone) != 10:
            raise HTTPException(status_code=400, detail="Phone number must be exactly 10 digits")
        db_lead.phone = cleaned_phone
        
    for key, val in update_dict.items():
        if key not in ["name", "phone"]:
            setattr(db_lead, key, val)
            
    try:
        db.commit()
        return {"message": "Lead Updated Successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database Error")

@router.delete("/{id}")
def delete_lead(id: int, db: Session = Depends(get_db)):
    db_lead = db.query(Lead).filter(Lead.id == id).first()
    if not db_lead:
        raise HTTPException(status_code=404, detail="Lead Not Found")
        
    try:
        db.delete(db_lead)
        db.commit()
        return {"message": "Lead Deleted Successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database Error")

# --- Bulk Upload CSV ---

@router.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        # Create uploads folder
        os.makedirs("uploads", exist_ok=True)
        file_path = f"uploads/{int(datetime.now().timestamp())}-{file.filename}"
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        leads_list = []
        with open(file_path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                name = row.get("name", row.get("Name", "Unknown")).strip()
                email = row.get("email", row.get("Email", None))
                phone = row.get("phone", row.get("Phone", ""))
                city = row.get("city", row.get("City", None))
                occupation = row.get("occupation", row.get("Occupation", None))
                
                investment_val = row.get("investment_amount", row.get("Investment Amount", None))
                investment_amount = None
                if investment_val:
                    try:
                        investment_amount = Decimal(str(investment_val))
                    except Exception:
                        pass
                        
                cleaned_phone = clean_phone_number(phone)
                leads_list.append(Lead(
                    name=name,
                    email=email.strip() if email else None,
                    phone=cleaned_phone,
                    city=city.strip() if city else None,
                    occupation=occupation.strip() if occupation else None,
                    investment_amount=investment_amount,
                    lead_source="CSV Upload"
                ))
                
        if leads_list:
            db.bulk_save_objects(leads_list)
            db.commit()
            
        return {
            "message": "CSV Uploaded Successfully",
            "totalLeads": len(leads_list)
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# --- Facebook Integration Endpoints ---

@router.get("/facebook/config", response_model=FacebookConfigSchema)
def get_config(db: Session = Depends(get_db)):
    config = db.query(FacebookConfig).order_by(FacebookConfig.id.desc()).first()
    if not config:
        return {"access_token": "", "page_id": "", "verify_token": "", "public_webhook_url": ""}
    return config

@router.post("/facebook/config")
def save_config(config_in: FacebookConfigSchema, db: Session = Depends(get_db)):
    try:
        config = db.query(FacebookConfig).order_by(FacebookConfig.id.desc()).first()
        if config:
            config.access_token = config_in.access_token
            config.page_id = config_in.page_id
            config.verify_token = config_in.verify_token
            config.public_webhook_url = config_in.public_webhook_url
        else:
            new_config = FacebookConfig(
                access_token=config_in.access_token,
                page_id=config_in.page_id,
                verify_token=config_in.verify_token,
                public_webhook_url=config_in.public_webhook_url
            )
            db.add(new_config)
        db.commit()
        return {"message": "Facebook configuration saved successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database Error")

@router.get("/facebook/webhook")
def verify_webhook(
    hub_mode: Optional[str] = Query(None, alias="hub.mode"),
    hub_verify_token: Optional[str] = Query(None, alias="hub.verify_token"),
    hub_challenge: Optional[str] = Query(None, alias="hub.challenge"),
    db: Session = Depends(get_db)
):
    write_log(f"Webhook verification request: mode={hub_mode}, token={hub_verify_token}, challenge={hub_challenge}")
    
    if hub_mode and hub_verify_token:
        config = db.query(FacebookConfig).order_by(FacebookConfig.id.desc()).first()
        expected_token = config.verify_token if (config and config.verify_token) else os.getenv("FB_VERIFY_TOKEN")
        
        if hub_mode == "subscribe" and hub_verify_token == expected_token:
            write_log("Facebook Webhook Verified successfully.")
            from fastapi.responses import Response
            return Response(content=hub_challenge, media_type="text/plain")
        else:
            write_log(f"Facebook Webhook verification failed. Token mismatch. Expected: {expected_token}, Got: {hub_verify_token}")
            raise HTTPException(status_code=403, detail="Forbidden")
            
    raise HTTPException(status_code=400, detail="Bad Request")

# Async background task for processing webhook leadgen events
async def process_webhook_lead(body: dict, db_session: Session):
    config = db_session.query(FacebookConfig).order_by(FacebookConfig.id.desc()).first()
    if not config or not config.access_token:
        write_log("No active Facebook configuration found or database error. Cannot fetch lead details.")
        return
        
    for entry in body.get("entry", []):
        for change in entry.get("changes", []):
            if change.get("field") == "leadgen":
                leadgen_id = str(change["value"]["leadgen_id"])
                write_log(f"Received Facebook Leadgen webhook for ID: {leadgen_id}")
                
                try:
                    fb_lead = None
                    if re.match(r"^4+$", leadgen_id):
                        write_log("Mock leadgen ID detected from Meta dashboard test button. Generating dummy lead details.")
                        fb_lead = {
                            "id": leadgen_id,
                            "field_data": [
                                {"name": "full_name", "values": ["Meta Dashboard Test"]},
                                {"name": "email", "values": ["dashboard_test@fb.com"]},
                                {"name": "phone", "values": ["1234567890"]},
                                {"name": "city", "values": ["California"]}
                            ]
                        }
                    else:
                        fb_url = f"https://graph.facebook.com/v20.0/{leadgen_id}"
                        write_log(f"Fetching lead details from Graph API using URL: https://graph.facebook.com/v20.0/{leadgen_id}?access_token=[HIDDEN]")
                        
                        async with httpx.AsyncClient() as client:
                            fb_res = await client.get(fb_url, params={"access_token": config.access_token})
                            if fb_res.status_code != 200:
                                write_log(f"Facebook API returned error status: {fb_res.status_code}. Body: {fb_res.text}")
                                raise Exception(f"Facebook API error: {fb_res.status_code} {fb_res.text}")
                            fb_lead = fb_res.json()
                            write_log(f"Successfully retrieved lead details: {fb_lead}")
                            
                    if fb_lead:
                        # Map lead details
                        name = "Facebook Lead"
                        email = ""
                        phone = "0000000000"
                        city = ""
                        occupation = ""
                        investment_amount = None
                        
                        if "field_data" in fb_lead:
                            for field in fb_lead["field_data"]:
                                field_name = field["name"].lower()
                                field_val = str(field["values"][0]) if (field.get("values") and field["values"][0]) else ""
                                
                                if field_name in ["full_name", "name"]:
                                    name = field_val
                                elif field_name == "first_name":
                                    name = field_val + (" " + name if name and name != "Facebook Lead" else "")
                                elif field_name == "last_name":
                                    name = (name + " " if name and name != "Facebook Lead" else "") + field_val
                                elif field_name == "email":
                                    email = field_val
                                elif field_name in ["phone_number", "phone"]:
                                    phone = field_val
                                elif field_name == "city":
                                    city = field_val
                                elif field_name == "occupation":
                                    occupation = field_val
                                elif field_name in ["investment_amount", "investment"]:
                                    try:
                                        investment_amount = Decimal(str(field_val))
                                    except Exception:
                                        pass
                                        
                        cleaned_phone = clean_phone_number(phone)
                        lead_data = {
                            "name": name.strip(),
                            "email": email.strip() if email else None,
                            "phone": cleaned_phone,
                            "city": city.strip() if city else None,
                            "occupation": occupation.strip() if occupation else None,
                            "investment_amount": investment_amount,
                            "lead_source": "Facebook Meta"
                        }
                        
                        write_log(f"Mapping lead data to database schema: {lead_data}")
                        
                        # Create lead
                        db_lead = Lead(**lead_data)
                        db_session.add(db_lead)
                        db_session.commit()
                        write_log(f"Automatic Facebook lead saved successfully with ID: {db_lead.id}")
                        
                except Exception as e:
                    write_log(f"Failed to process lead details for leadgen_id {leadgen_id}: {str(e)}")

@router.post("/facebook/webhook")
async def handle_webhook(request: Request, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")
        
    write_log(f"Received webhook request body: {body}")
    
    if body.get("object") == "page":
        background_tasks.add_task(process_webhook_lead, body, db)
        from fastapi.responses import Response
        return Response(content="EVENT_RECEIVED", media_type="text/plain")
        
    raise HTTPException(status_code=404)

@router.post("/facebook/test-webhook", status_code=201)
def handle_test_webhook(lead_in: LeadCreate, db: Session = Depends(get_db)):
    if not lead_in.name or not lead_in.name.strip():
        raise HTTPException(status_code=400, detail="Name is required for test lead")
        
    cleaned_phone = clean_phone_number(lead_in.phone)
    test_lead = Lead(
        name=lead_in.name.strip(),
        email=lead_in.email.strip() if lead_in.email else None,
        phone=cleaned_phone,
        city=lead_in.city.strip() if lead_in.city else None,
        occupation=lead_in.occupation.strip() if lead_in.occupation else None,
        investment_amount=lead_in.investment_amount,
        lead_source="Facebook Meta"
    )
    
    try:
        db.add(test_lead)
        db.commit()
        db.refresh(test_lead)
        return {
            "message": "Mock Lead Webhook processed successfully!",
            "leadId": test_lead.id,
            "lead": {
                "name": test_lead.name,
                "email": test_lead.email,
                "phone": test_lead.phone,
                "city": test_lead.city,
                "occupation": test_lead.occupation,
                "investment_amount": float(test_lead.investment_amount) if test_lead.investment_amount else None,
                "lead_source": test_lead.lead_source
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database Error")

@router.post("/facebook/sync")
async def sync_facebook_leads(request: Request, db: Session = Depends(get_db)):
    try:
        body = await request.json()
    except Exception:
        body = {}
        
    days = body.get("days")
    write_log(f"Starting manual Facebook leads sync for last {days or 'all'} days...")
    
    config = db.query(FacebookConfig).order_by(FacebookConfig.id.desc()).first()
    if not config or not config.access_token or not config.page_id:
        write_log("Facebook configuration missing page_id or access_token. Sync aborted.")
        raise HTTPException(
            status_code=400, 
            detail="Facebook Page ID and Page Access Token are required. Please configure and save them first."
        )
        
    try:
        since = None
        if days and days != "all":
            try:
                days_int = int(days)
                since = int(datetime.now().timestamp()) - (days_int * 24 * 60 * 60)
                write_log(f"Filtering leads submitted since Unix Timestamp: {since}")
            except Exception:
                pass
                
        # 1. Fetch Forms
        forms_url = f"https://graph.facebook.com/v20.0/{config.page_id}/leadgen_forms"
        write_log(f"Fetching forms from: {forms_url}")
        
        async with httpx.AsyncClient() as client:
            forms_res = await client.get(forms_url, params={"access_token": config.access_token})
            if forms_res.status_code != 200:
                write_log(f"Facebook API returned error fetching forms: {forms_res.status_code}. Body: {forms_res.text}")
                raise Exception(f"Failed to fetch lead forms: {forms_res.status_code} {forms_res.text}")
            
            forms_data = forms_res.json()
            forms = forms_data.get("data", [])
            write_log(f"Found {len(forms)} lead forms for Page.")
            
            total_checked = 0
            imported_count = 0
            skipped_count = 0
            
            # 2. Fetch leads for each form with auto-pagination
            for form in forms:
                form_id = form["id"]
                form_name = form.get("name", "Unknown Form")
                write_log(f"Fetching leads for form: {form_name} (ID: {form_id})")
                
                leads_url = f"https://graph.facebook.com/v20.0/{form_id}/leads"
                params = {
                    "limit": 100,
                    "access_token": config.access_token
                }
                if since:
                    params["since"] = since
                    
                while leads_url:
                    write_log(f"Requesting leads page from: {leads_url[:120]}...")
                    leads_res = await client.get(leads_url, params=params)
                    # Clear params after first page since next page URLs contain the query params already
                    params = {} 
                    
                    if leads_res.status_code != 200:
                        write_log(f"Error fetching leads for form {form_id}: {leads_res.status_code}. Body: {leads_res.text}")
                        break
                        
                    leads_data = leads_res.json()
                    fb_leads = leads_data.get("data", [])
                    write_log(f"Retrieved {len(fb_leads)} leads on this page for form: {form_name}")
                    
                    for fb_lead in fb_leads:
                        total_checked += 1
                        
                        # Map lead details
                        name = "Facebook Lead"
                        email = ""
                        phone = "0000000000"
                        city = ""
                        occupation = ""
                        investment_amount = None
                        
                        if "field_data" in fb_lead:
                            for field in fb_lead["field_data"]:
                                field_name = field["name"].lower()
                                field_val = str(field["values"][0]) if (field.get("values") and field["values"][0]) else ""
                                
                                if field_name in ["full_name", "name"]:
                                    name = field_val
                                elif field_name == "first_name":
                                    name = field_val + (" " + name if name and name != "Facebook Lead" else "")
                                elif field_name == "last_name":
                                    name = (name + " " if name and name != "Facebook Lead" else "") + field_val
                                elif field_name == "email":
                                    email = field_val
                                elif field_name in ["phone_number", "phone"]:
                                    phone = field_val
                                elif field_name == "city":
                                    city = field_val
                                elif field_name == "occupation":
                                    occupation = field_val
                                elif field_name in ["investment_amount", "investment"]:
                                    try:
                                        investment_amount = Decimal(str(field_val))
                                    except Exception:
                                        pass
                                        
                        cleaned_phone = clean_phone_number(phone)
                        
                        # Check duplicate
                        clean_email = email.strip() if email else ""
                        duplicate = db.query(Lead.id).filter(
                            or_(
                                and_(Lead.email == clean_email, Lead.email != ""),
                                and_(Lead.phone == cleaned_phone, Lead.phone != "")
                            )
                        ).first()
                        
                        if duplicate:
                            skipped_count += 1
                            continue
                            
                        # Save
                        db_lead = Lead(
                            name=name.strip(),
                            email=clean_email if clean_email else None,
                            phone=cleaned_phone,
                            city=city.strip() if city else None,
                            occupation=occupation.strip() if occupation else None,
                            investment_amount=investment_amount,
                            lead_source="Facebook Meta"
                        )
                        db.add(db_lead)
                        db.commit()
                        imported_count += 1
                        
                    leads_url = leads_data.get("paging", {}).get("next")
                    
        write_log(f"Sync complete. Checked: {total_checked}, Imported: {imported_count}, Skipped: {skipped_count}")
        return {
            "message": "Sync completed successfully!",
            "totalChecked": total_checked,
            "importedCount": imported_count,
            "skippedCount": skipped_count
        }
    except Exception as e:
        write_log(f"Exception during Facebook leads sync: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")
