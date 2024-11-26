
from typing import List
from google.cloud import firestore

from repositories.book_repository.base import Book, BookRepository


class FirebaseBookRepository(BookRepository):
  def __init__(self, firebase_client: firestore.Client, collection_name:str):
    self._client = firebase_client
    self._collection_name = collection_name
    self._collection = self._client.collection(
    self._collection_name)

  def save(self, book: Book) -> None:
    self._collection.document(book.id).set(book.model_dump())

  def get(self, book_id: str, user_id: str) -> Book:
    print(f"Getting book with id: {book_id} and user_id: {user_id}")
    docs = self._collection.where('user_id', '==', user_id).where('id', '==', book_id).limit(1).get()
    # Get the first matching document (if any)
    for doc in docs:
      return Book.model_validate(doc.to_dict())

    return None

  def get_by_book_id(self, book_id: str) -> Book:
    docs = self._collection.where('id', '==', book_id).limit(1).get()
    for doc in docs:
      return Book.model_validate(doc.to_dict())

    return None

  def list(self, user_id: str) -> List[Book]:
    docs = self._collection.where('user_id', '==', user_id).select(['id', 'title']).get()
    return [Book(**doc.to_dict()) for doc in docs]
