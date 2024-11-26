from datetime import datetime, timezone
from dependency_injector.wiring import inject, Provide
from fastapi import APIRouter, Response, Depends, status, HTTPException

from api.settings import Settings
from api.models.content_section import GetAllContentSectionsResponse, GetContentSectionRangeResponse
from container.prod import Container
from repositories.book_content_section_repository.base import BookContentSectionRepository
from repositories.book_repository.base import BookRepository
from shared.authentication.base import UserInfo


settings = Settings()
content_section_router = APIRouter()
  
  
@content_section_router.get("/get_content_section", tags=["ContentSection"])
@inject
async def get_content_section_range_handler(book_id:str, page_num:int,
  content_section_repository: BookContentSectionRepository = Depends(lambda: Container.book_content_section_repository()),
  book_repository: BookRepository = Depends(lambda: Container.book_repository()),
  user_info:UserInfo = Depends(Container.token_decoder)):
  """
  Get content section for a page
  """
  book = book_repository.get(book_id, user_info.user_id)
  if not book:
    raise HTTPException(status_code=404, detail="Book not found")

  if not book.content_section_generated:
    raise HTTPException(status_code=404, detail="Content section not generated")

  content_section = content_section_repository.get_by_page(
    book_id, page_num, user_info.user_id)
  
  if not content_section:
    raise HTTPException(status_code=404, detail="Content section not found")
  
  return GetContentSectionRangeResponse(start_page=content_section.start_page, end_page=content_section.end_page)


@content_section_router.get("/content_section", tags=["ContentSection"])
@inject
async def get_all_content_sections_handler(book_id:str,
  content_section_repository: BookContentSectionRepository = Depends(lambda: Container.book_content_section_repository()),
  user_info:UserInfo = Depends(Container.token_decoder)):
  """
  Get all content sections for a page range
  """
  content_sections = content_section_repository.get_all(book_id, user_info.user_id, exclude_pages=True)
  return GetAllContentSectionsResponse(content_sections=content_sections)