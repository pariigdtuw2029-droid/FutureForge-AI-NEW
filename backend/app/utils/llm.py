import os 
from dotenv import load_dotenv 
from google import genai 
from langchain_google_genai import ChatGoogleGenerativeAI 
from pydantic import BaseModel

#schema 
class ExperienceItem(BaseModel): 
    role:str 
    company:str 
    duration_months:int 

class ResumeInfo(BaseModel):
    candidate_name: str | None = None
    cgpa: float | None = None
    github: str | None = None
    skills: list[str] = []
    projects: list[str] = []
    education: str | None = None
    experience: list[ExperienceItem] = []
    college_year: int | None = None
    no_of_internships: int | None = None


load_dotenv() 

def ask_gemini(prompt): 
    api_key = os.getenv("GEMINI_API_KEY") 
    client = genai.Client(api_key=api_key) 
    response = client.models.generate_content( 
        model="gemini-2.5-flash", 
        contents=prompt ) 
    return response.text 

def extract_resume_info(resume_text): 

    llm = ChatGoogleGenerativeAI( 
        model="gemini-2.5-flash", 
        google_api_key=os.getenv("GEMINI_API_KEY") ) 
    structured_llm = llm.with_structured_output(ResumeInfo) 

    prompt = f""" Extract structured information from the following resume text. 
    Return these fields: 
    - candidate_name 
    - cgpa 
    - github 
    - skills 
    - projects 
    - education 
    - experience 
    - college_year 
    - no_of_internships 
    Rules: 
    - Use only the information present in the resume text. 
    - Do not invent details. 
    - If a field is missing, return null for single-value fields and [] for list fields. 
    - For experience, return a list of objects with: role, company, duration_months 
    Resume text:{resume_text} """

    result = structured_llm.invoke(prompt) 
    return result