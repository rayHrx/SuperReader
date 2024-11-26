
import tempfile
from pydantic import BaseModel
import pymupdf
import logging

from typing import List


from file_service.base import FileService
from llm_agent.book_content_section_creater.content_section_creater import ContentSectionCreater
from message_broker.pubsub_message_broker import MessageBroker
from repositories.book_content_section_repository.base import BookContentSection, BookContentSectionRepository, Page
from repositories.book_repository.base import Book, BookRepository

class PostProcessingJob(BaseModel):
  book_id: str
  
class ProcessingService:
  def __init__(self, message_broker: MessageBroker, 
               file_service: FileService, 
               book_repository: BookRepository,
               book_content_section_repository: BookContentSectionRepository,
               content_section_creater:ContentSectionCreater) -> None:
    self._message_broker = message_broker
    self._file_service = file_service
    self._book_repository = book_repository
    self._book_content_section_repository = book_content_section_repository
    self._content_section_creater = content_section_creater


  def start(self) -> None:
    while True:
      job = self._message_broker.get_next_job()
      if job is None:
        logging.info("No job to process")
        continue

      logging.info(f"Processing job: {job.model_dump_json()}")
      self._process_job(job)
      logging.info(f"Job processed: {job.model_dump_json()}")


  def _process_job(self, job: PostProcessingJob) -> None:
    with tempfile.TemporaryDirectory() as temp_dir:
      temp_file_path = f'{temp_dir}/{job.book_id}'
      self._file_service.download_to_destination(job.book_id, temp_file_path)

      book = self._book_repository.get_by_book_id(job.book_id)
      if book.content_section_generated:
        logging.info(f"Content section already generated for book: {job.book_id}")
        return
      
      if book.type == "pdf":
        all_content_sections = self._process_pdf(temp_file_path, book)
      
      # TODO: Wrap in transaction
      book.content_section_generated = True
      self._book_content_section_repository.save_multiple(all_content_sections)
      self._book_repository.save(book)


  def _process_pdf(self, temp_file_path: str, book: Book) -> List[Page]:
    BATCH_PAGE_COUNT = 50
    BATCH_TOKEN_COUNT = 20000

    batch_page = []
    batch_token_count = 0
    all_content_sections = []

    doc = pymupdf.open(temp_file_path)
    for page_number, page in enumerate(doc): # iterate the document pages
      book_page = Page(
        page_num=page_number,
        content=page.get_text().strip())
      
      batch_page.append(book_page)
      batch_token_count += len(page.get_text()) / 4

      if (len(batch_page) == BATCH_PAGE_COUNT or 
          batch_token_count >= BATCH_TOKEN_COUNT):
        
        batch_page_dict = {p.page_num:p for p in batch_page}
        page_ranges = self._content_section_creater.create_content_section_from_pages(batch_page)
        for page_range in page_ranges:
          book_content_section = BookContentSection(
            book_id=book.id, user_id=book.user_id,
            start_page=page_range['start_page'],
            end_page=page_range['end_page'],
            pages=[batch_page_dict[p_num] for p_num in range(page_range['start_page'], page_range['end_page']+1)])
          all_content_sections.append(book_content_section)
        
        batch_page = []
        batch_token_count = 0
    return all_content_sections