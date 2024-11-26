from abc import ABC, abstractmethod

class FileService(ABC):
  @abstractmethod
  def get_upload_url(self, file_name: str) -> str:
    pass

  def get_download_url(self, file_name: str) -> str:
    pass

  def exists(self, file_name: str) -> bool:
    pass

  def download_to_destination(self, file_name: str, destination_path: str) -> str:
    pass
