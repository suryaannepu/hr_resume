"""Resume parsing utilities using PyMuPDF"""
import fitz
import json
import re

def extract_text_from_pdf(pdf_path):
    """Extract text from PDF file"""
    text = ""
    try:
        doc = fitz.open(pdf_path)
        for page in doc:
            text += page.get_text()
        doc.close()
    except Exception as e:
        print(f"Error reading PDF: {e}")
    return text

def extract_text_from_base64(base64_string):
    """Extract text from base64 encoded PDF"""
    import base64
    import io
    
    try:
        pdf_bytes = base64.b64decode(base64_string)
        pdf_stream = io.BytesIO(pdf_bytes)
        doc = fitz.open(stream=pdf_stream, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text
    except Exception as e:
        print(f"Error extracting text from base64: {e}")
        return ""

def extract_email(text):
    """Extract email from resume text"""
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    emails = re.findall(email_pattern, text)
    return emails[0] if emails else None

def extract_phone(text):
    """Extract phone number from resume text"""
    phone_pattern = r'(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
    phones = re.findall(phone_pattern, text)
    return phones[0] if phones else None

def basic_resume_parsing(text):
    """Basic resume parsing to extract key information"""
    lines = text.split('\n')
    
    # Extract first line as potential name
    name = lines[0].strip() if lines else "Unknown"
    
    # Extract email and phone
    email = extract_email(text)
    phone = extract_phone(text)
    
    # Extract education (look for keywords)
    education_keywords = ['B.S.', 'B.A.', 'M.S.', 'M.B.A.', 'PhD', 'Bachelor', 'Master', 'Diploma']
    education = []
    for line in lines:
        if any(keyword in line for keyword in education_keywords):
            education.append(line.strip())
    
    return {
        "name": name,
        "email": email,
        "phone": phone,
        "education": education[:3],  # Take first 3
        "raw_text": text[:2000]  # Store first 2000 chars for LLM processing
    }
