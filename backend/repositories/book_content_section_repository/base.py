from abc import ABC, abstractmethod
from typing import List
from pydantic import BaseModel


class Page(BaseModel):
  page_num:int
  content:str

class BookContentSection(BaseModel):
  book_id: str
  user_id: str
  start_page:int
  end_page:int
  pages: List[Page]

class BookContentSectionRepository(ABC):
  @abstractmethod
  def save(self, book_content_section: BookContentSection) -> None:
    pass
  
  @abstractmethod
  def save_multiple(self, book_content_sections: List[BookContentSection]) -> None:
    pass

  @abstractmethod
  def get_by_book_id(self, book_id:str) -> List[BookContentSection]:  
    pass

  @abstractmethod
  def get_by_page(self, book_id:str, page_num:int, user_id:str = None) -> BookContentSection:
    pass

  @abstractmethod
  def get_by_range(self, book_id:str, start_page:int, end_page:int, user_id:str = None) -> BookContentSection:
    pass

  @abstractmethod
  def get_all(self, book_id:str, user_id:str = None) -> List[BookContentSection]:
    pass