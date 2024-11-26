from file_service.base import FileService

from google.auth import compute_engine
from google.auth.transport import requests

import google.cloud.storage as storage


class GcpFileService(FileService):
  def __init__(self, bucket_name: str, service_account_email: str) -> None:
    self._client = storage.Client()
    self._bucket_name = bucket_name
    self._bucket = self._client.bucket(bucket_name)
    self._service_account_email = service_account_email


  def get_upload_url(self, file_name: str) -> str:
    blob = self._bucket.blob(file_name)
    auth_request = requests.Request()   
    signing_credentials = compute_engine.IDTokenCredentials(
    auth_request,
    "",
    service_account_email=self._service_account_email
    )
    return blob.generate_signed_url(
      expiration=3600, 
      credentials=signing_credentials,
      version='v4', 
      method='PUT')


  def get_download_url(self, file_name: str) -> str:
    blob = self._bucket.blob(file_name)
    auth_request = requests.Request()
    signing_credentials = compute_engine.IDTokenCredentials(
    auth_request,
    "",
    service_account_email=self._service_account_email
    )
  
    return blob.generate_signed_url(
      expiration=3600,
      credentials=signing_credentials,
      version="v4",
      method="GET")


  def exists(self, file_name: str) -> bool:
    blob = self._bucket.blob(file_name)
    return blob.exists()

  def download_to_destination(self, file_name: str, destination_path: str) -> str:
    blob = self._bucket.blob(file_name)
    blob.download_to_filename(destination_path)