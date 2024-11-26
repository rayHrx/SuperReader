import firebase_admin

from dependency_injector import containers, providers
from google.cloud.storage import Client, Bucket
from firebase_admin import credentials
from firebase_admin import firestore
from google.cloud import pubsub_v1

from api.settings import Settings
from content_distill_processing.processing_service import ContentDistillProcessingJob, ContentDistillProcessingService
from file_service.gcp import GcpFileService
from llm_agent.book_content_section_creater.content_section_creater import ContentSectionCreater
from llm_agent.book_content_section_distill.content_section_distiller import ContentSectionDistiller
from message_broker.pubsub_message_broker import MessageBroker
from post_upload_processing.processing_service import PostProcessingJob, ProcessingService
from repositories.book_content_section_repository.firebase import FirebaseBookContentSectionRepository
from repositories.book_distilled_page_repository.firebase import FirebaseBookDistilledPageRepository
from repositories.book_repository.firebase import FirebaseBookRepository
from shared.authentication.base import DummyDecoder
from shared.authentication.firestore_bearer import FirestoreTokenDecoder


settings = Settings()

def create_none():
  return None

class Container(containers.DeclarativeContainer):
    wiring_config = containers.WiringConfiguration(modules=["api.routes.book", 
                                                            "api.routes.distilled_content"])
    config = providers.Configuration()
    config.from_dict(
       {'gcp_service_account_loading_mode': settings.gcp_service_account_loading_mode}
    )
    
    storage_client = providers.Selector(
      config.gcp_service_account_loading_mode,
      default=providers.Singleton(Client),
      path=providers.Singleton(Client.from_service_account_json, json_credentials_path=settings.gcp_service_account_path),
    )
    
    file_service = providers.Factory(
      GcpFileService,
      bucket_name=settings.book_bucket_name,
      service_account_email=settings.gcp_service_account_email
    )

    fire_store_credentials = providers.Selector(
      config.gcp_service_account_loading_mode,
      path=providers.Singleton(credentials.Certificate, cert=settings.gcp_service_account_path),
      default=providers.Singleton(create_none)
    )

    # Only initialize if no apps exist
    if not firebase_admin._apps:
      print("Initializing firebase app")
      firebase_admin.initialize_app(fire_store_credentials())

    # api key service related component
    firestore_client = providers.Singleton(
      firestore.client)

    book_repository = providers.Singleton(
      FirebaseBookRepository,
      firebase_client=firestore_client,
      collection_name=settings.book_firestore_collection
    )

    book_content_section_repository = providers.Singleton(
      FirebaseBookContentSectionRepository,
      firebase_client=firestore_client,
      collection_name=settings.book_content_section_firestore_collection
    )

    pubsub_publisher = providers.Singleton(
      pubsub_v1.PublisherClient,
    )

    pubsub_subscriptor = providers.Singleton(
      pubsub_v1.SubscriberClient,
    )

    post_upload_message_broker = providers.Singleton(
      MessageBroker,
      pubsub_topic=settings.post_upload_pubsub_topic,
      pubsub_subscription=settings.post_upload_pubsub_subscription,
      pubsub_publisher=pubsub_publisher,
      pubsub_subscriptor=pubsub_subscriptor,
      model_type=PostProcessingJob
    )

    content_section_creater = providers.Singleton(
      ContentSectionCreater,
      openai_api_key=settings.open_ai_api_key
    )
    
    content_section_processing_service = providers.Singleton(
      ProcessingService,
      message_broker=post_upload_message_broker,
      file_service=file_service,
      book_repository=book_repository,
      book_content_section_repository=book_content_section_repository,
      content_section_creater=content_section_creater
    )

    content_section_distiller = providers.Singleton(
      ContentSectionDistiller,
      openai_api_key=settings.open_ai_api_key,
      model='gpt-4o'
    )
    
    book_distilled_page_repository = providers.Singleton(
      FirebaseBookDistilledPageRepository,
      firebase_client=firestore_client,
      collection_name=settings.book_distilled_page_firestore_collection
    )

    content_distill_message_broker = providers.Singleton(
      MessageBroker,
      pubsub_topic=settings.content_distill_pubsub_topic,
      pubsub_subscription=settings.content_distill_pubsub_subscription,
      pubsub_publisher=pubsub_publisher,
      pubsub_subscriptor=pubsub_subscriptor,
      model_type=ContentDistillProcessingJob
    )

    content_distill_processing_service = providers.Singleton(
        ContentDistillProcessingService,
        message_broker=content_distill_message_broker,
        book_content_section_repository=book_content_section_repository,
        book_distilled_page_repository=book_distilled_page_repository,
        content_section_distiller=content_section_distiller
    )

    # token_decoder = FirestoreTokenDecoder(
    #    subscription_cache = subscription_cache())
    token_decoder = DummyDecoder()
