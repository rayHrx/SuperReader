from typing import Union
from pydantic import BaseModel

from repositories.book_repository.base import Book


class SetBookUploadedRequest(BaseModel):
  book_id: str


class PostBookRequest(BaseModel):
  type: str


class PostBookResponse(BaseModel):
  book_id: str
  upload_url: str


class GetBookResponse(BaseModel):
  book_id: str
  download_url: str


class ListBooksResponse(BaseModel):
  books: list[Book]
