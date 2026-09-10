import chromadb
import uuid
from app.core.config import settings

class ChromaStore:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ChromaStore, cls).__new__(cls)
            cls._instance.client = chromadb.PersistentClient(path=settings.CHROMA_DB_DIR)
            cls._instance.collection = cls._instance.client.get_or_create_collection(name="patient_reports")
        return cls._instance

    def add_report(self, patient_id: int, screening_id: str, content: str):
        doc_id = str(uuid.uuid4())
        self.collection.add(
            documents=[content],
            metadatas=[{"patient_id": patient_id, "screening_id": screening_id, "type": "report"}],
            ids=[doc_id]
        )

    def search_patient_reports(self, patient_id: int, query: str, top_k: int = 3):
        results = self.collection.query(
            query_texts=[query],
            n_results=top_k,
            where={"patient_id": patient_id}
        )
        return results

    def delete_patient_reports(self, patient_id: int):
        try:
            self.collection.delete(where={"patient_id": patient_id})
        except Exception as e:
            pass

chroma_store = ChromaStore()
