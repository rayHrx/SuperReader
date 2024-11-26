from pydantic import BaseModel

from repositories.book_distilled_page_repository.base import DistilledPage


class GetDistilledContentResponse(BaseModel):
  distilled_page: DistilledPage