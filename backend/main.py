import base64
import json
import logging
import traceback

from typing import Dict, Any
from content_distill_processing.processing_service import ContentDistillProcessingJob, ContentDistillProcessingService
from container.prod import Container
from dependency_injector.wiring import Provide, inject
from post_upload_processing.processing_service import PostProcessingJob, ProcessingService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize container at module level
container = Container()
container.init_resources()
container.wire(modules=[__name__])


def process_book_upload_message(message: Dict[str, Any] = None) -> None:
    """Process a single Pub/Sub message."""
    # Can not get dependency injector to work here
    processing_service = container.content_section_processing_service()

    processing_job = PostProcessingJob.model_validate(message)
    logging.info(f"Processing job: {processing_job.model_dump_json()}")
    processing_service._process_job(processing_job)
    logging.info(f"Job processed: {processing_job.model_dump_json()}")


def process_book_upload(event: Dict[str, Any], context: Any) -> None:
    """Cloud Function entry point for Pub/Sub triggers."""
    logger.info("Function triggered by Pub/Sub event")
    
    try:
      if 'data' in event:
          pubsub_message = base64.b64decode(event['data']).decode('utf-8')
          message = json.loads(pubsub_message)
          logger.info(f"Processing message: {message}")
      else:
          message = None
          logger.warning("No data found in Pub/Sub message")

      process_book_upload_message(message=message)
        
    except Exception as e:
      logger.error(f"Error processing message: {str(e)}")
      logger.error(traceback.format_exc())
      raise e


def process_content_distill_message(message: Dict[str, Any] = None) -> None:
    """Process a single Pub/Sub message."""
    # Can not get dependency injector to work here
    processing_service = container.content_distill_processing_service()

    processing_job = ContentDistillProcessingJob.model_validate(message)
    logging.info(f"Processing job: {processing_job.model_dump_json()}")
    processing_service._process_job(processing_job)
    logging.info(f"Job processed: {processing_job.model_dump_json()}")

def process_content_distill(event: Dict[str, Any], context: Any) -> None:
    """Cloud Function entry point for Pub/Sub triggers."""
    logger.info("Function triggered by Pub/Sub event")
    
    try:
      if 'data' in event:
          pubsub_message = base64.b64decode(event['data']).decode('utf-8')
          message = json.loads(pubsub_message)
          logger.info(f"Processing message: {message}")
      else:
          message = None
          logger.warning("No data found in Pub/Sub message")

      process_content_distill_message(message=message)
        
    except Exception as e:
      logger.error(f"Error processing message: {str(e)}")
      logger.error(traceback.format_exc())
      raise e