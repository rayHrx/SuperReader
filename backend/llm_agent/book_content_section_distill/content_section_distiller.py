import json
import re 
from time import time
from openai import OpenAI
from repositories.book_content_section_repository.base import Page
from repositories.book_distilled_page_repository.base import DistilledPageParagraph
from llm_agent.costar_builder import CostarPromptBuilder

MINIMUM_PARAGRAPH_LENGTH = 400

class ContentSectionDistiller:
  def __init__(self, openai_api_key:str, model:str = 'gpt-4o-mini') -> None:
    self._openai_api_key = openai_api_key
    self._model = model


  def merge_paragraphs(self, paragraphs:list[DistilledPageParagraph]) -> list[DistilledPageParagraph]:
    new_paragraphs = []
    for paragraph in paragraphs:
      if not new_paragraphs:
        new_paragraphs.append(paragraph)
      elif (len(new_paragraphs[-1].content) < MINIMUM_PARAGRAPH_LENGTH and 
            new_paragraphs[-1].type == 'core' and 
            paragraph.type == 'core'):
        new_paragraphs[-1] = DistilledPageParagraph(
          type=paragraph.type,
          content=new_paragraphs[-1].content + ' ' + paragraph.content,
          pages=list(dict.fromkeys(new_paragraphs[-1].pages + paragraph.pages)))
      else:
        new_paragraphs.append(paragraph)
    
    return new_paragraphs


  def summarize_content(self, book_pages:list[Page]) -> tuple[int, int, list[DistilledPageParagraph]]:
    client = OpenAI(api_key=self._openai_api_key)

    prompt = CostarPromptBuilder().add_context(
    """
    Your task is to create a distilled version of the pages taken out from a book, preserves its essence and impact while being more concise. Think of this as crafting a concentrated reading experience rather than a mere summary. 
    The distilled version consist of two kinds of content:

    1. Core content: The most important ideas, insights, and arguments of the original text.
    2. Transition content: The content that connects the core content and help readers to follow the ideas of the author.

    <Requirements for core content>:
    Craft a flowing narrative that maintains the intellectual depth and distinctive perspective of the original text. 
    Focus particularly on the author's original insights, counterintuitive propositions, and unique analytical framework. 
    When encountering passages that offer groundbreaking perspectives or profound analysis, preserve them in their original form or with minimal modification - these moments are the heart of the work's contribution.
    The result should feel like reading the original book in a more concentrated form - allowing readers to grasp the fundamental ideas, experience the author's perspective, and arrive at the same meaningful conclusions in less time.
    However, do not sacrafice the coherent flow of the original work, use transition words and appropriate context for readers to follow the ideas of the author.
    Essential elements to maintain:
    - The author's distinctive voice, style, and intellectual approach
    - Original and thought-provoking propositions that challenge conventional thinking
    - Key arguments and the evidence that supports them
    - Vivid examples and memorable moments that anchor complex concepts
    - The logical progression that builds the author's unique perspective
    - Significant passages that deserve to be quoted in full due to their exceptional insight or elegant expression
    - The interconnections between ideas that reveal the author's broader philosophical or analytical framework
    The goal is for readers to finish this concentrated version feeling they've truly experienced the heart of the work, not just learned about it.
    Style the distilled version in a way that is engaging, interesting and easy to read.

    <Requirements for transition content>:
    The goal of the transition content is to form a coherent narrative that connects the core content and help readers to follow the ideas of the author. The transition content guild the readers 
    from the last core content to the next core content, by briefly concluding the last core content and briefly introducing the next core content.
    - You are encouraged to use thrid person narrative to generate the transition content.
    - The transition content should be concise and to the point.
    - The length of the transition content should be much shorter than the core content for the sake of maintaining the coherent flow of the original work.
    - Create transition content in between the core content, only if necessary. If the core content is continuous and coherent, you can skip the transition content.

    
    """
    ).add_objective(
    f"""
    Here are the pages to distill:
    {json.dumps([page.model_dump() for page in book_pages])}
    Each page contains a page_num and content
    """
    ).add_response(
      ("""
       For core content, indicate from which page/pages the different parts of the distilled version use information, by putting the page numbers as comma separated string in parentheses after the sentence e.g: (Core: x,y,z).
       For transition content, indicate it is a transition content by adding the word "Transition" after the sentence. e.g: (Transition).
       
       e.g:
       This is sentence 1. Then this is sentence 2. (Core: 2,3,4) This is sentence 3. (Core: 5) This is a transtion content. (Transition) This is sentence 4. (Core: 6,7) This is another transition content. (Transition) This is sentence 5. (Core: 8,9,10,11)
       
       Return the answer in a json format: 
       """
       '{"result" : "formatted distilled version"}'
      )
    
    ).build()
    
    start_time = time()
    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
        temperature=0.2,
        response_format={ "type": "json_object" },
        model=self._model,
    )
    end_time = time()
    print(f'Time taken gpt: {end_time - start_time} seconds')

    start_time = time()
    result = json.loads(chat_completion.choices[0].message.content)
    distilled_version = result['result']
    print(distilled_version)

    def parse_content_sections(text: str) -> list[dict]:
      # First, let's split the text into sections based on both Core and Transition markers
      sections = []
      
      # Match both Core and Transition sections
      pattern = r'(.*?)(?:\(Core: ([0-9,\s]+)\)|\(Transition\))'
      
      # Find all matches including the last section
      current_pos = 0
      for match in re.finditer(pattern, text, re.DOTALL):
          content = match.group(1).strip()
          if not content:
              continue
          
          content = content.strip(" .\n")
          content = f'{content}.'

          marker = text[match.start():match.end()]
          current_pos = match.end()
          
          if 'Core:' in marker:
              pages = [int(p.strip()) for p in match.group(2).split(',')]
              sections.append({
                  "type": "core",
                  "pages": pages,
                  "content": content
              })
          elif 'Transition' in marker:
              sections.append({
                  "type": "transition",
                  "content": content
              })
      
      # Handle the remaining text after the last marker
      remaining = text[current_pos:].strip()
      last_marker = re.search(r'\((Core: [0-9,\s]+|Transition)\)[^(]*$', text)
      if last_marker and remaining:
          if 'Core:' in last_marker.group(1):
              pages = [int(p.strip()) for p in re.search(r'Core: ([0-9,\s]+)', last_marker.group(1)).group(1).split(',')]
              sections.append({
                  "type": "core",
                  "pages": pages,
                  "content": remaining
              })
          elif 'Transition' in last_marker.group(1):
              sections.append({
                  "type": "transition",
                  "content": remaining
              })
      
      return sections
    
    sections = parse_content_sections(distilled_version)
    distilled_page_paragraphs = []
    for section in sections:
      if section['type'] == 'core':
        distilled_page_paragraphs.append(DistilledPageParagraph(
          type=section['type'], content=section['content'],
          pages=section['pages']))
      elif section['type'] == 'transition':
        distilled_page_paragraphs.append(DistilledPageParagraph(
          type=section['type'], content=section['content'], 
          pages=[]))

    merged_paragraphs = self.merge_paragraphs(distilled_page_paragraphs)
    end_time = time()
    print(f'Time taken formatting: {end_time - start_time} seconds')

    return book_pages[0].page_num, book_pages[-1].page_num, merged_paragraphs