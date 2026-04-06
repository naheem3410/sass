import io
import zipfile

from services.abstractions.document_parser import DocumentParser


class UniversalDocumentParser(DocumentParser):
    def extract_text(self, file_bytes: bytes, filename: str) -> str:
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        extractor = self._get_extractor(ext)
        return extractor(file_bytes)

    def _get_extractor(self, ext: str):
        extractors = {
            "pdf":  self._from_pdf,
            "docx": self._from_docx,
            "doc":  self._from_doc,
            "md":   self._from_markdown,
            "txt":  self._from_txt,
            "rtf":  self._from_rtf,
            "odt":  self._from_odt,
        }
        if ext not in extractors:
            raise ValueError(f"Unsupported file type: .{ext}")
        return extractors[ext]

    def _from_pdf(self, file_bytes: bytes) -> str:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            return "\n".join(p.extract_text() or "" for p in pdf.pages)

    def _from_docx(self, file_bytes: bytes) -> str:
        from docx import Document as DocxDocument
        doc = DocxDocument(io.BytesIO(file_bytes))
        return "\n".join(
            para.text for para in doc.paragraphs if para.text.strip()
        )

    def _from_doc(self, file_bytes: bytes) -> str:
        raise ValueError(
            ".doc format is not directly supported. "
            "Please ask the candidate to re-upload as .docx or .pdf"
        )

    def _from_markdown(self, file_bytes: bytes) -> str:
        import markdown
        from bs4 import BeautifulSoup
        md_text = file_bytes.decode("utf-8", errors="ignore")
        html = markdown.markdown(md_text)
        return BeautifulSoup(html, "html.parser").get_text(separator="\n")

    def _from_txt(self, file_bytes: bytes) -> str:
        return file_bytes.decode("utf-8", errors="ignore")

    def _from_rtf(self, file_bytes: bytes) -> str:
        from striprtf.striprtf import rtf_to_text
        return rtf_to_text(file_bytes.decode("utf-8", errors="ignore"))

    def _from_odt(self, file_bytes: bytes) -> str:
        from bs4 import BeautifulSoup
        with zipfile.ZipFile(io.BytesIO(file_bytes)) as z:
            with z.open("content.xml") as f:
                soup = BeautifulSoup(f.read(), "xml")
                return soup.get_text(separator="\n")
