from abc import ABC, abstractmethod
from datetime import datetime
from typing import List
from pydantic import BaseModel


class Book(BaseModel):
  id: str
  title: str
  type: str
  user_id: str
  created_datetime: datetime
  is_uploaded: bool = False
  content_section_generated: bool = False


class BookRepository(ABC):
  @abstractmethod
  def save(self, book: Book) -> None:
    pass

  @abstractmethod
  def get(self, book_id: str, user_id: str) -> Book:
    pass

  @abstractmethod
  def get_by_book_id(self, book_id: str) -> Book:
    pass

  @abstractmethod
  def list(self, user_id: str) -> List[Book]:
    pass
