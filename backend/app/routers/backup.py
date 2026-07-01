from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.services import backup_service

router = APIRouter(prefix="/backup", tags=["Backup"])

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MiB

@router.get("/export-excel")
def export_excel(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        excel_data = backup_service.generate_excel(current_user, db)
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        filename = f"tapcash-backup-{today}.xlsx"
        
        headers = {
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
        
        return StreamingResponse(
            excel_data,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers=headers
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao exportar dados: {str(e)}"
        )

@router.post("/import-excel")
async def import_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate extension
    if not file.filename.endswith(".xlsx"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato de arquivo inválido. Apenas arquivos .xlsx são permitidos."
        )

    # Read and validate size
    try:
        contents = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Falha ao ler o arquivo: {str(e)}"
        )
        
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Arquivo muito grande. O limite máximo é de 10 MiB."
        )

    # Database transaction wrapper
    tx = db.begin_nested()
    try:
        summary = backup_service.process_excel_upload(contents, current_user, db)
        tx.commit()
        db.commit()
        return summary
    except Exception as e:
        tx.rollback()
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/template-expenses")
def download_template_expenses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        excel_data = backup_service.generate_expenses_template(current_user, db)
        filename = "tapcash-modelo-despesas.xlsx"
        
        headers = {
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
        
        return StreamingResponse(
            excel_data,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers=headers
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao gerar modelo de despesas: {str(e)}"
        )

