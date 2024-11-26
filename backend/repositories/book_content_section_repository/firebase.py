from typing import List
from google.cloud import firestore

from repositories.book_content_section_repository.base import BookContentSection, BookContentSectionRepository

class FirebaseBookContentSectionRepository(BookContentSectionRepository):
  def __init__(self, firebase_client: firestore.Client, collection_name:str):
    self._client = firebase_client
    self._collection_name = collection_name
    self._collection = self._client.collection(
    self._collection_name)


  def save(self, book_content_section: BookContentSection) -> None:
    self._collection.document(book_content_section.id).set(book_content_section.model_dump())


  def save_multiple(self, book_content_sections: List[BookContentSection]) -> None:
    # Batch write
    batch = self._client.batch()
    for book_content_section in book_content_sections:
      batch.set(self._collection.document(), book_content_section.model_dump())
    batch.commit()
  

  def get_by_book_id(self, book_id:str) -> List[BookContentSection]:
    docs = self._collection.where(
      'book_id', '==', book_id).get()
    return [BookContentSection(**doc.to_dict()) for doc in docs]


  def get_by_page(self, book_id:str, page_num:int, user_id:str = None) -> BookContentSection:
    if user_id:
      docs = self._collection.where(
        'book_id', '==', book_id).where(
        'user_id', '==', user_id).where(
        'start_page', '<=', page_num).where(
        'end_page', '>=', page_num).get() 
    else:
      docs = self._collection.where(
        'book_id', '==', book_id).where(
        'start_page', '<=', page_num).where(
        'end_page', '>=', page_num).limit(1).get()
    if not docs:
      return None
    
    return BookContentSection(**docs[0].to_dict())
  

  def get_by_range(self, book_id:str, start_page:int, end_page:int, user_id:str = None) -> BookContentSection:
    if user_id:
      docs = self._collection.where(
        'book_id', '==', book_id).where(
        'user_id', '==', user_id).where(
        'start_page', '==', start_page).where(
        'end_page', '==', end_page).limit(1).get()
    else:
      docs = self._collection.where(
        'book_id', '==', book_id).where(
        'start_page', '==', start_page).where(
        'end_page', '==', end_page).limit(1).get()
    if not docs:
      return None
    
    return BookContentSection(**docs[0].to_dict())


  def get_all(self, book_id:str, user_id:str = None) -> List[BookContentSection]:
    if user_id:
      docs = self._collection.where('book_id', '==', book_id).where('user_id', '==', user_id).get()
    else:
      docs = self._collection.where('book_id', '==', book_id).get()
    return [BookContentSection(**doc.to_dict()) for doc in docs]