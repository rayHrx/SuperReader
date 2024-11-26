from datetime import datetime, timezone
from dependency_injector.wiring import inject, Provide
from fastapi import APIRouter, Response, Depends, status, HTTPException

from api.settings import Settings
from api.models.distilled_content import GetDistilledContentResponse
from container.prod import Container
from content_distill_processing.processing_service import ContentDistillProcessingJob
from message_broker.pubsub_message_broker import MessageBroker
from repositories.book_content_section_repository.base import BookContentSectionRepository
from repositories.book_distilled_page_repository.base import BookDistilledPageRepository, DistilledPage, ProcessingStatus
from shared.authentication.base import UserInfo


settings = Settings()
distilled_content_router = APIRouter()
  

@distilled_content_router.get("/get_distilled_content", tags=["DistilledContent"])
@inject
async def get_distilled_content_handler(book_id: str, start_page: int, end_page: int,
  book_distilled_page_repository: BookDistilledPageRepository = Depends(lambda: Container.book_distilled_page_repository()),
  content_section_repository: BookContentSectionRepository = Depends(lambda: Container.book_content_section_repository()),
  message_broker: MessageBroker = Depends(lambda: Container.content_distill_message_broker()),
  user_info:UserInfo = Depends(Container.token_decoder)):
  """
  Collect usser feedback on content
  """
  distilled_page = book_distilled_page_repository.get(book_id, start_page, end_page,
    user_info.user_id)
  
  if not distilled_page:
    content_sections = content_section_repository.get_by_range(book_id, start_page, end_page,
      user_info.user_id)
    
    if not content_sections:
      raise HTTPException(status_code=404, detail="No content sections of page range found")
    else:
      book_distilled_page = DistilledPage(
        book_id=book_id, user_id=user_info.user_id,
        start_page=start_page, end_page=end_page,
        paragraphs=[], created_datetime=datetime.now(timezone.utc),
        processing_status=ProcessingStatus.IN_PROGRESS)  
      book_distilled_page_repository.save(book_distilled_page)
      message_broker.publish_job(ContentDistillProcessingJob(
        book_id=book_id, start_page=start_page, end_page=end_page))
      return Response(status_code=status.HTTP_202_ACCEPTED, content="Processing started")

  else:
    if distilled_page.processing_status == ProcessingStatus.COMPLETED:
      return GetDistilledContentResponse(distilled_page=distilled_page)
    else:
      return Response(status_code=status.HTTP_202_ACCEPTED, content="Processing in progress")