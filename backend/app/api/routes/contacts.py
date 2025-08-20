"""
Rotas para gerenciamento de contatos
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from app.core.database import get_db, Contact

router = APIRouter()

class ContactUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    company: Optional[str] = None
    position: Optional[str] = None
    status: Optional[str] = None

@router.get("/")
async def get_contacts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Listar contatos com filtros e paginação
    """
    try:
        query = db.query(Contact)
        
        # Aplicar filtros
        if status:
            query = query.filter(Contact.status == status)
        
        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                (Contact.name.ilike(search_filter)) |
                (Contact.phone.ilike(search_filter)) |
                (Contact.email.ilike(search_filter)) |
                (Contact.company.ilike(search_filter))
            )
        
        # Contar total
        total = query.count()
        
        # Aplicar paginação
        contacts = query.offset(skip).limit(limit).all()
        
        return {
            "contacts": [
                {
                    "id": contact.id,
                    "name": contact.name,
                    "phone": contact.phone,
                    "email": contact.email,
                    "company": contact.company,
                    "position": contact.position,
                    "status": contact.status,
                    "source_file": contact.source_file,
                    "created_at": contact.created_at.isoformat(),
                    "updated_at": contact.updated_at.isoformat()
                }
                for contact in contacts
            ],
            "total": total,
            "skip": skip,
            "limit": limit
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{contact_id}")
async def get_contact(
    contact_id: int,
    db: Session = Depends(get_db)
):
    """
    Obter contato específico
    """
    try:
        contact = db.query(Contact).filter(Contact.id == contact_id).first()
        if not contact:
            raise HTTPException(status_code=404, detail="Contato não encontrado")
        
        return {
            "id": contact.id,
            "name": contact.name,
            "phone": contact.phone,
            "email": contact.email,
            "company": contact.company,
            "position": contact.position,
            "status": contact.status,
            "source_file": contact.source_file,
            "created_at": contact.created_at.isoformat(),
            "updated_at": contact.updated_at.isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{contact_id}")
async def update_contact(
    contact_id: int,
    contact_update: ContactUpdate,
    db: Session = Depends(get_db)
):
    """
    Atualizar contato
    """
    try:
        contact = db.query(Contact).filter(Contact.id == contact_id).first()
        if not contact:
            raise HTTPException(status_code=404, detail="Contato não encontrado")
        
        # Atualizar campos fornecidos
        update_data = contact_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(contact, field, value)
        
        db.commit()
        db.refresh(contact)
        
        return {
            "message": "Contato atualizado com sucesso",
            "contact": {
                "id": contact.id,
                "name": contact.name,
                "phone": contact.phone,
                "email": contact.email,
                "company": contact.company,
                "position": contact.position,
                "status": contact.status,
                "updated_at": contact.updated_at.isoformat()
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{contact_id}")
async def delete_contact(
    contact_id: int,
    db: Session = Depends(get_db)
):
    """
    Deletar contato
    """
    try:
        contact = db.query(Contact).filter(Contact.id == contact_id).first()
        if not contact:
            raise HTTPException(status_code=404, detail="Contato não encontrado")
        
        db.delete(contact)
        db.commit()
        
        return {"message": "Contato deletado com sucesso"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats/summary")
async def get_contacts_summary(db: Session = Depends(get_db)):
    """
    Obter resumo estatístico dos contatos
    """
    try:
        total_contacts = db.query(Contact).count()
        pending_contacts = db.query(Contact).filter(Contact.status == "pending").count()
        sent_contacts = db.query(Contact).filter(Contact.status == "sent").count()
        delivered_contacts = db.query(Contact).filter(Contact.status == "delivered").count()
        failed_contacts = db.query(Contact).filter(Contact.status == "failed").count()
        
        return {
            "total": total_contacts,
            "pending": pending_contacts,
            "sent": sent_contacts,
            "delivered": delivered_contacts,
            "failed": failed_contacts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/bulk-update-status")
async def bulk_update_contact_status(
    contact_ids: List[int],
    status: str,
    db: Session = Depends(get_db)
):
    """
    Atualizar status de múltiplos contatos
    """
    try:
        if status not in ["pending", "sent", "delivered", "failed"]:
            raise HTTPException(status_code=400, detail="Status inválido")
        
        updated_count = db.query(Contact).filter(
            Contact.id.in_(contact_ids)
        ).update({"status": status})
        
        db.commit()
        
        return {
            "message": f"{updated_count} contatos atualizados com sucesso",
            "updated_count": updated_count
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

