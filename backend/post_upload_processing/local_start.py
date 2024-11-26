import logging

from container.prod import Container
from dependency_injector.wiring import Provide, inject

from backend.post_upload_processing.processing_service import ProcessingService

@inject
def main(processing_service: ProcessingService = Provide[Container.content_section_processing_service]) -> None:
  processing_service.start()

if __name__ == '__main__':
  logging.basicConfig(level=logging.INFO)

  container = Container()
  container.init_resources()
  container.wire(modules=[__name__])

  main()
