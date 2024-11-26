from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()

class Settings(BaseSettings):
  book_bucket_name: str = 'superreader-book-bucket'

  book_firestore_collection: str = 'BookInfo'
  book_content_section_firestore_collection: str = 'BookContentSection'
  book_distilled_page_firestore_collection: str = 'BookDistilledPage'
  
  post_upload_pubsub_topic: str = 'projects/superreader-442520/topics/post-upload-processing'
  post_upload_pubsub_subscription: str = 'projects/superreader-442520/subscriptions/post-upload-processing-sub'
  content_distill_pubsub_topic: str = 'projects/superreader-442520/topics/content-distill-processing'
  content_distill_pubsub_subscription: str = 'projects/superreader-442520/subscriptions/content-distill-processing-sub'

  gcp_service_account_path: str = ''
  gcp_service_account_json: str = ''
  gcp_service_account_loading_mode:str = 'default'
  open_ai_api_key: str = ''
  claude_api_key: str = ''
  revenuecat_api_key:str = ''
  gcp_service_account_email:str = 'api-server@bitbitdive.iam.gserviceaccount.com'