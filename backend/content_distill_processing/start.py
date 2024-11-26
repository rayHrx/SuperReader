import logging

from backend.container.prod import Container
from dependency_injector.wiring import Provide, inject

from backend.content_distill_processing.processing_service import ContentDistillProcessingService

@inject
def main(processing_service: ContentDistillProcessingService = Provide[Container.content_distill_processing_service]) -> None:
  processing_service.start()

if __name__ == '__main__':
  logging.basicConfig(level=logging.INFO)

  container = Container()
  container.init_resources()
  container.wire(modules=[__name__])

  main()
