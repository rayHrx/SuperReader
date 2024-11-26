
from datetime import datetime, timezone
import logging
from pydantic import BaseModel


from llm_agent.book_content_section_distill.content_section_distiller import ContentSectionDistiller
from message_broker.pubsub_message_broker import MessageBroker
from repositories.book_content_section_repository.base import BookContentSection, BookContentSectionRepository, Page
from repositories.book_distilled_page_repository.base import BookDistilledPageRepository, DistilledPage, ProcessingStatus


class ContentDistillProcessingJob(BaseModel):
  book_id: str
  start_page: int
  end_page: int


class ContentDistillProcessingService:
  def __init__(self, message_broker: MessageBroker,  
               book_content_section_repository: BookContentSectionRepository,
               book_distilled_page_repository: BookDistilledPageRepository,
               content_section_distiller: ContentSectionDistiller) -> None:
    self._message_broker = message_broker
    self._book_content_section_repository = book_content_section_repository
    self._book_distilled_page_repository = book_distilled_page_repository
    self._content_section_distiller = content_section_distiller

  def start(self) -> None:
    while True:
      job = self._message_broker.get_next_job()
      if job is None:
        logging.info("No job to process")
        continue

      logging.info(f"Processing job: {job.model_dump_json()}")
      self._process_job(job)
      logging.info(f"Job processed: {job.model_dump_json()}")


  def _process_job(self, job: ContentDistillProcessingJob) -> None:
    content_section = self._book_content_section_repository.get_by_range(
      job.book_id, job.start_page, job.end_page)

    distilled_page = self._book_distilled_page_repository.get(
      job.book_id, job.start_page, job.end_page)

    if distilled_page and distilled_page.processing_status == ProcessingStatus.COMPLETED:
      return
    
    if not distilled_page:  
      distilled_page = DistilledPage(
        book_id=job.book_id,
        user_id=content_section.user_id,
        start_page=job.start_page,
        end_page=job.end_page,
        paragraphs=[],
        created_datetime=datetime.now(timezone.utc),
        processing_status=ProcessingStatus.IN_PROGRESS)
    else:
      distilled_page = DistilledPage(
        book_id=distilled_page.book_id,
        user_id=distilled_page.user_id,
        start_page=distilled_page.start_page,
        end_page=distilled_page.end_page,
        paragraphs=[],
        created_datetime=distilled_page.created_datetime,
        processing_status=ProcessingStatus.IN_PROGRESS)
    
    self._book_distilled_page_repository.save(distilled_page)
    start_page, end_page, paragraphs = self._content_section_distiller.summarize_content(content_section.pages)
    distilled_page = DistilledPage(
      book_id=distilled_page.book_id,
      user_id=distilled_page.user_id,
      start_page=start_page,
      end_page=end_page,
      paragraphs=paragraphs,
      created_datetime=distilled_page.created_datetime,
      processing_status=ProcessingStatus.COMPLETED)
    
    self._book_distilled_page_repository.save(distilled_page)
