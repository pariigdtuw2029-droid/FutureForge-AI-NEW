from app.services.gemini_service import ask_gemini

reply = ask_gemini("Tell me one Python interview question.")

print(reply)