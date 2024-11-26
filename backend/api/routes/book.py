import uuid
import traceback

from datetime import datetime, timezone
from fastapi import APIRouter, Response, Depends, status, HTTPException

from api.settings import Settings
from api.models.book import GetBookResponse, PostBookRequest, PostBookResponse, SetBookUploadedRequest
from container.prod import Container
from file_service.base import FileService
from message_broker.pubsub_message_broker import MessageBroker
from post_upload_processing.processing_service import PostProcessingJob
from repositories.book_repository.base import Book, BookRepository
from shared.authentication.base import UserInfo


settings = Settings()
book_router = APIRouter()
  

@book_router.post("/book", tags=["Book"], status_code=200)
async def post_book_handler(
  post_book_request: PostBookRequest,
  book_repository: BookRepository = Depends(lambda: Container.book_repository()),
  file_service: FileService = Depends(lambda: Container.file_service()),
  user_info:UserInfo = Depends(lambda: Container.token_decoder())):
  """
  Collect usser feedback on content
  """
  print("post_book_handler")
  try:
    book = Book(
      id=str(uuid.uuid4()),
      user_id=user_info.user_id,
      title="",
      type=post_book_request.type,
      created_datetime=datetime.now(timezone.utc),
      is_uploaded=False,
      content_section_generated=False
    )
    book_repository.save(book)
    upload_url = file_service.get_upload_url(book.id)

    return PostBookResponse(
      book_id=book.id,
      upload_url=upload_url
    )
  except Exception:
    # TODO: Inject logging handler
    print(traceback.format_exc())
    raise HTTPException(
      status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


@book_router.get("/book/{book_id}", tags=["Book"], status_code=200)
async def get_book_handler(
  book_id: str, book_repository: BookRepository = Depends(lambda: Container.book_repository()),
  file_service: FileService = Depends(lambda: Container.file_service()),
  user_info:UserInfo = Depends(lambda: Container.token_decoder())):

  book = book_repository.get(book_id, user_info.user_id)
  
  if not book or not book.is_uploaded:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
  
  download_url = file_service.get_download_url(book.id)

  return GetBookResponse(
    book_id=book.id,
    download_url=download_url
  )


@book_router.patch("/set_book_uploaded", tags=["Book"], status_code=200)
async def set_book_uploaded_handler(
  set_book_uploaded_response: SetBookUploadedRequest,
  book_repository: BookRepository = Depends(lambda: Container.book_repository()),
  file_service: FileService = Depends(lambda: Container.file_service()),
  post_upload_message_broker: MessageBroker = Depends(lambda: Container.post_upload_message_broker()),
  user_info:UserInfo = Depends(lambda: Container.token_decoder())):

  book = book_repository.get(set_book_uploaded_response.book_id, user_info.user_id)
  if not book:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
  
  if not file_service.exists(book.id):
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
  
  if book.is_uploaded:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Book already uploaded")
  
  book.is_uploaded = True
  book_repository.save(book)
  post_upload_message_broker.publish_job(PostProcessingJob(book_id=book.id))