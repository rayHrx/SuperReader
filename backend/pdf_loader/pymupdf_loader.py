import pymupdf

from pdf_loader.base import PdfLoader
from models import BookPage
from typing import List

class PymupdfLoader(PdfLoader):
  def load_pdf(self, file_path: str) -> List[BookPage]:
    doc = pymupdf.open(file_path)
    pages = []
    for page_number, page in enumerate(doc): # iterate the document pages
      pages.append(BookPage(
        page_num=page_number,
        content=page.get_text().strip()))
    return pages

