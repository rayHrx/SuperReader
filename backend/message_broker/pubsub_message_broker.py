from typing import Optional, Type
from google.cloud import pubsub_v1
from pydantic import BaseModel


class MessageBroker:
  def __init__(self, pubsub_publisher: pubsub_v1.PublisherClient,
               pubsub_topic: str,
               pubsub_subscriptor: pubsub_v1.SubscriberClient,
               pubsub_subscription: str,
               model_type: Type[BaseModel]) -> None:
    self._pubsub_topic = pubsub_topic
    self._pubsub_publisher = pubsub_publisher
    self._pubsub_subscriptor = pubsub_subscriptor
    self._pubsub_subscription = pubsub_subscription
    self._model_type = model_type


  def publish_job(self, model: BaseModel) -> None:
    self._pubsub_publisher.publish(
      topic=self._pubsub_topic,
      data=model.model_dump_json().encode("utf-8")
    )
  

  def get_next_job(self) -> Optional[BaseModel]:
    
    response = self._pubsub_subscriptor.pull(
        request={
            "subscription": self._pubsub_subscription,
            "max_messages": 1,
        }
    )

    # Check if we received any messages
    if not response.received_messages:
        return None

    received_message = response.received_messages[0]

    # The actual message data is in received_message.message.data
    return self._model_type.model_validate_json(
        received_message.message.data.decode('utf-8')
    )