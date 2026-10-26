from dataclasses import dataclass
import os


@dataclass(frozen=True)
class Settings:
    port: int = int(os.getenv("PORT", "4000"))
    mongodb_uri: str = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017")
    mongodb_database: str = os.getenv("MONGODB_DATABASE", "ontology_lifecycle")
    client_origin: str = os.getenv("CLIENT_ORIGIN", "http://localhost:5173")
    seed_demo_data: bool = os.getenv("SEED_DEMO_DATA", "true").lower() != "false"
    max_assessment_workers: int = int(os.getenv("ASSESSMENT_WORKERS", "4"))


settings = Settings()
