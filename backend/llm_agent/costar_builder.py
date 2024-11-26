class CostarPromptBuilder:
  def __init__(self) -> None:
    self._context = None
    self._objective = None
    self._style = None
    self._tone = None
    self._audience = None
    self._response = None

  def add_context(self, text:str) -> 'CostarPromptBuilder':
    self._context = text
    return self

  def add_objective(self, text:str) -> 'CostarPromptBuilder':
    self._objective = text
    return self

  def add_style(self, text:str) -> 'CostarPromptBuilder':
    self._style = text
    return self

  def add_tone(self, text:str) -> 'CostarPromptBuilder':
    self._tone = text
    return self

  def add_audience(self, text:str) -> 'CostarPromptBuilder':
    self._audience = text
    return self

  def add_response(self, text:str) -> 'CostarPromptBuilder':
    self._response = text
    return self

  def build(self) -> str:
    if not self._context:
      raise Exception('Prompt must contain a context, use add_context to add a context')

    if not self._objective:
      raise Exception('Prompt must contain an objective, use add_context to add an objective')
    
    if not self._response:
      raise Exception('Prompt must contain an response, use add_context to add a response')
      
    prompt = '' 

    prompt += f'''
    # CONTEXT #

    {self._context}

    '''

    prompt += f'''
    # OBJECTIVE #

    {self._objective}

    '''

    if self._style:
      prompt +=f'''
      # STYLE #

      {self._style}

      '''

    if self._tone:
      prompt += f'''
      # TONE #

      {self._tone}

      '''

    if self._audience:
      prompt += f'''
      # AUDIENCE #

      {self._audience}

      '''

    prompt += f'''
    # RESPONSE #

    {self._response}
    '''

    return prompt