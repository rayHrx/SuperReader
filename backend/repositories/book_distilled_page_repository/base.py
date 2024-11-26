from abc import ABC, abstractmethod
from datetime import datetime
from enum import Enum
from typing import List
from pydantic import BaseModel

class ProcessingStatus(str, Enum):
  IN_PROGRESS = "IN_PROGRESS"
  COMPLETED = "COMPLETED"

class DistilledPageParagraph(BaseModel):
  type:str
  content:str
  pages:list[int]


class DistilledPage(BaseModel):
  book_id:str
  user_id:str
  start_page:int
  end_page:int
  paragraphs:list[DistilledPageParagraph]
  created_datetime:datetime
  processing_status:ProcessingStatus


class BookDistilledPageRepository(ABC):
  @abstractmethod
  def save(self, distilled_page: DistilledPage) -> None:
    pass

  @abstractmethod
  def get(self, book_id: str, start_page: int, end_page: int, user_id:str = None) -> DistilledPage:
    pass