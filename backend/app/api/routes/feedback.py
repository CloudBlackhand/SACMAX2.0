"""
Rotas para templates de feedback
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from app.core.database import get_db, FeedbackTemplate

router = APIRouter()

class FeedbackTemplateCreate(BaseModel):
    name: str
    content: str
    variables: Optional[Dict[str, Any]] = None

class FeedbackTemplateUpdate(BaseModel):
    name: Optional[str] = None
    content: Optional[str] = None
    variables: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

@router.get("/templates")
async def get_feedback_templates(
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """
    Listar templates de feedback
    """
    try:
        query = db.query(FeedbackTemplate)
        
        if active_only:
            query = query.filter(FeedbackTemplate.is_active == True)
        
        templates = query.order_by(FeedbackTemplate.created_at.desc()).all()
        
        return {
            "templates": [
                {
                    "id": template.id,
                    "name": template.name,
                    "content": template.content,
                    "variables": template.variables or {},
                    "is_active": template.is_active,
                    "created_at": template.created_at.isoformat(),
                    "updated_at": template.updated_at.isoformat()
                }
                for template in templates
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/templates/{template_id}")
async def get_feedback_template(
    template_id: int,
    db: Session = Depends(get_db)
):
    """
    Obter template específico
    """
    try:
        template = db.query(FeedbackTemplate).filter(
            FeedbackTemplate.id == template_id
        ).first()
        
        if not template:
            raise HTTPException(status_code=404, detail="Template não encontrado")
        
        return {
            "id": template.id,
            "name": template.name,
            "content": template.content,
            "variables": template.variables or {},
            "is_active": template.is_active,
            "created_at": template.created_at.isoformat(),
            "updated_at": template.updated_at.isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/templates")
async def create_feedback_template(
    template: FeedbackTemplateCreate,
    db: Session = Depends(get_db)
):
    """
    Criar novo template de feedback
    """
    try:
        # Verificar se já existe template com mesmo nome
        existing = db.query(FeedbackTemplate).filter(
            FeedbackTemplate.name == template.name
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=400,
                detail="Já existe um template com este nome"
            )
        
        new_template = FeedbackTemplate(
            name=template.name,
            content=template.content,
            variables=template.variables or {},
            is_active=True
        )
        
        db.add(new_template)
        db.commit()
        db.refresh(new_template)
        
        return {
            "message": "Template criado com sucesso",
            "template": {
                "id": new_template.id,
                "name": new_template.name,
                "content": new_template.content,
                "variables": new_template.variables,
                "is_active": new_template.is_active,
                "created_at": new_template.created_at.isoformat()
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/templates/{template_id}")
async def update_feedback_template(
    template_id: int,
    template_update: FeedbackTemplateUpdate,
    db: Session = Depends(get_db)
):
    """
    Atualizar template de feedback
    """
    try:
        template = db.query(FeedbackTemplate).filter(
            FeedbackTemplate.id == template_id
        ).first()
        
        if not template:
            raise HTTPException(status_code=404, detail="Template não encontrado")
        
        # Verificar se o novo nome já existe (se estiver sendo alterado)
        if template_update.name and template_update.name != template.name:
            existing = db.query(FeedbackTemplate).filter(
                FeedbackTemplate.name == template_update.name,
                FeedbackTemplate.id != template_id
            ).first()
            
            if existing:
                raise HTTPException(
                    status_code=400,
                    detail="Já existe um template com este nome"
                )
        
        # Atualizar campos fornecidos
        update_data = template_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(template, field, value)
        
        db.commit()
        db.refresh(template)
        
        return {
            "message": "Template atualizado com sucesso",
            "template": {
                "id": template.id,
                "name": template.name,
                "content": template.content,
                "variables": template.variables,
                "is_active": template.is_active,
                "updated_at": template.updated_at.isoformat()
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/templates/{template_id}")
async def delete_feedback_template(
    template_id: int,
    db: Session = Depends(get_db)
):
    """
    Deletar template de feedback
    """
    try:
        template = db.query(FeedbackTemplate).filter(
            FeedbackTemplate.id == template_id
        ).first()
        
        if not template:
            raise HTTPException(status_code=404, detail="Template não encontrado")
        
        db.delete(template)
        db.commit()
        
        return {"message": "Template deletado com sucesso"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/templates/{template_id}/toggle")
async def toggle_feedback_template(
    template_id: int,
    db: Session = Depends(get_db)
):
    """
    Ativar/desativar template
    """
    try:
        template = db.query(FeedbackTemplate).filter(
            FeedbackTemplate.id == template_id
        ).first()
        
        if not template:
            raise HTTPException(status_code=404, detail="Template não encontrado")
        
        template.is_active = not template.is_active
        db.commit()
        
        return {
            "message": f"Template {'ativado' if template.is_active else 'desativado'} com sucesso",
            "is_active": template.is_active
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/templates/{template_id}/preview")
async def preview_feedback_template(
    template_id: int,
    variables: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """
    Visualizar template com variáveis substituídas
    """
    try:
        template = db.query(FeedbackTemplate).filter(
            FeedbackTemplate.id == template_id
        ).first()
        
        if not template:
            raise HTTPException(status_code=404, detail="Template não encontrado")
        
        # Substituir variáveis no conteúdo
        preview_content = template.content
        for key, value in variables.items():
            preview_content = preview_content.replace(f"{{{key}}}", str(value))
        
        return {
            "original_content": template.content,
            "preview_content": preview_content,
            "variables_used": variables
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

