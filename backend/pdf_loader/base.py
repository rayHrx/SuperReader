from abc import ABC, abstractmethod
from typing import List

from backend.models import BookPage

class PdfLoader(ABC):
  @abstractmethod
  def load_pdf(self, file_path: str) -> List[BookPage]:
    pass
