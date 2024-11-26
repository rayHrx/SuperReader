from repositories.book_content_section_repository.base import Page
from content_section_distiller import ContentSectionDistiller


import time
import pymupdf
import json



doc = pymupdf.open('/Users/ray/Library/Containers/com.apple.BKAgentService/Data/Documents/iBooks/Books/the-psychology-of-money-by-morgan-housel.pdf')

pages = []
for page_number, page in enumerate(doc): # iterate the document pages
  pages.append(Page(
    page_num=page_number,
    content=page.get_text().strip()))

distiller = ContentSectionDistiller(openai_api_key="")

start_time = time.time()
distilled_page = distiller.summarize_content(book_pages=pages[75:86])
end_time = time.time()
print(f'Time taken: {end_time - start_time} seconds')


print(json.dumps( [d.model_dump() for d in distilled_page[2]], indent=2))