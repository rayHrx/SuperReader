from pydantic import BaseModel

from repositories.book_content_section_repository.base import BookContentSection


class GetContentSectionRangeResponse(BaseModel):
  start_page: int
  end_page: int

class GetAllContentSectionsResponse(BaseModel):
  content_sections: list[BookContentSection]