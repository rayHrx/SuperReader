from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from container.prod import Container
from api.routes.book import book_router
from api.routes.distilled_content import distilled_content_router
from api.routes.content_section import content_section_router

container = Container()

app = FastAPI(title="SuperReader API",
    description="Backend",
    version="1.0.0")
app.container = container
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(book_router)
app.include_router(distilled_content_router)
app.include_router(content_section_router)
