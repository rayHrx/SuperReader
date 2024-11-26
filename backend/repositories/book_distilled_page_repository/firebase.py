from google.cloud import firestore
from repositories.book_distilled_page_repository.base import BookDistilledPageRepository, DistilledPage


class FirebaseBookDistilledPageRepository(BookDistilledPageRepository):
  def __init__(self, firebase_client: firestore.Client, collection_name:str):
    self._client = firebase_client
    self._collection_name = collection_name
    self._collection = self._client.collection(
    self._collection_name)

  def save(self, distilled_page: DistilledPage) -> None:
    # Query for existing entry
    existing_docs = (self._collection
        .where('book_id', '==', distilled_page.book_id)
        .where('start_page', '==', distilled_page.start_page)
        .where('end_page', '==', distilled_page.end_page)
        .limit(1)
        .get())

    # If exists, update the existing document
    for doc in existing_docs:
      doc.reference.set(distilled_page.model_dump())
      return

    # If no existing document found, create new one
    self._collection.document().set(distilled_page.model_dump())

  def get(self, book_id: str, start_page: int, end_page: int, user_id:str = None) -> DistilledPage:
    if user_id: 
      docs = (self._collection
              .where('book_id', '==', book_id)
              .where('start_page', '==', start_page)
              .where('end_page', '==', end_page)
              .where('user_id', '==', user_id)
              .limit(1)
              .get())
    else:
      docs = (self._collection
              .where('book_id', '==', book_id)
              .where('start_page', '==', start_page)
              .where('end_page', '==', end_page)
              .limit(1)
              .get())
    
    if not docs:
      return None
    
    return DistilledPage(**docs[0].to_dict())