import json

from openai import OpenAI
from repositories.book_content_section_repository.base import Page
from llm_agent.costar_builder import CostarPromptBuilder


class ContentSectionCreater:
  def __init__(self, openai_api_key:str, model:str = 'gpt-4o-mini') -> None:
    self._openai_api_key = openai_api_key
    self._model = model

  def create_content_section_from_pages(self, pages:list[Page]) -> list[dict]:
    client = OpenAI(api_key=self._openai_api_key)

    prompt = CostarPromptBuilder().add_context(
      ("You are the best book analyser in the world. "
       f"Given a list of book pages: {json.dumps([p.model_dump() for p in pages])} "
       "Each page contains a page number and its content. "
      )
    ).add_objective(
      ("Your goal is to create appropriate content section according to content of the pages. "
       "Each content section consist of pages that can be summerized all together. "
       "Therefore each content section should revolve around single (or closely related) concepts. "
       "Skip pages of 'Table of contents' and 'Appendix', do not include them in any final content sections. "
       "")
    ).add_response(
      ("Return the answer in a json format, where each content section contains a start-page and end-page index, for example: "
       '/{"content-sections" : [{"start-page":x, "end-page":y}, {"start-page":y+1, "end-page":z} ] /}')
    ).build()
    
    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
        response_format={ "type": "json_object" },
        model=self._model,
    )

    book_ranges = []

    result = json.loads(chat_completion.choices[0].message.content)
    for content_section in result['content-sections']:
      book_ranges.append({
        "start_page":content_section['start-page'],
        "end_page":content_section['end-page']
      })
    
    return book_ranges