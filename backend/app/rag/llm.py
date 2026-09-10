from app.core.config import settings

system_prompt = """You are the MedVisionAI Report Assistant. You help a patient understand information from their authorized MedVisionAI screening records.
Use the supplied patient-specific context as the primary source.
Do not invent findings. Do not diagnose. Do not prescribe medication. Do not provide unsupported clinical certainty.
If the requested information is not present in the provided context, clearly state that it is not available in the report.
For medical decisions, direct the patient to an appropriately qualified healthcare professional.
Never reveal information belonging to another patient. Keep answers simple, clear, and grounded in the supplied report context.
Always use standard ASCII characters, standard hyphens (-), and regular spaces. Do not output non-breaking hyphens or unusual unicode symbols."""


def sanitize_llm_text(text: str) -> str:
    """Clean out non-breaking hyphens, narrow spaces, and special unicode symbols."""
    if not text:
        return text
    # Replace non-breaking hyphens (\u2011) and dashes with standard ASCII hyphen (-)
    text = text.replace('\u2011', '-').replace('\u2012', '-').replace('\u2013', '-').replace('\u2014', '-')
    # Replace non-breaking spaces (\u00a0, \u202f, \u200b) with standard space
    text = text.replace('\u00a0', ' ').replace('\u202f', ' ').replace('\u200b', '')
    # Replace smart quotes with standard quotes
    text = text.replace('\u201c', '"').replace('\u201d', '"').replace('\u2018', "'").replace('\u2019', "'")
    return text


def generate_rag_response(query: str, context: list, history: list = None) -> str:
    """
    Generate a RAG response. Supports:
    - Groq AI (if LLM_API_KEY starts with 'gsk' or 'llama'/'groq' in model name)
    - xAI Grok (if LLM_API_KEY starts with 'xai-' or 'grok' in model name)
    - Google Gemini (if LLM_API_KEY starts with 'AIza')
    - Fallback smart summary based on report context
    """
    context_str = "\n---\n".join(context) if context else "No report context available."
    api_key = settings.LLM_API_KEY.strip() if settings.LLM_API_KEY else ""

    # 1. Try Groq Cloud (API keys starting with 'gsk' or 'gsk-')
    if api_key and (api_key.startswith("gsk") or "llama" in settings.LLM_MODEL.lower()):
        try:
            from openai import OpenAI

            client = OpenAI(
                api_key=api_key,
                base_url=settings.GROQ_BASE_URL,
            )

            messages = [{"role": "system", "content": system_prompt}]
            if history:
                for msg in history:
                    role = "assistant" if msg["role"] == "model" else "user"
                    messages.append({"role": role, "content": msg["parts"][0]})

            user_content = f"Patient Query: {query}\n\nReport Context:\n{context_str}"
            messages.append({"role": "user", "content": user_content})

            valid_groq_models = ["groq/compound", "groq/compound-mini", "openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b"]
            model_name = settings.LLM_MODEL if settings.LLM_MODEL in valid_groq_models else "groq/compound"

            completion = client.chat.completions.create(
                model=model_name,
                messages=messages,
                temperature=0.0,
                max_tokens=512,
            )
            return sanitize_llm_text(completion.choices[0].message.content)
        except Exception as e:
            return f"Groq AI encountered an error: {str(e)}. Please verify your Groq API key in backend/.env."

    # 2. Try xAI Grok (if key starts with 'xai-')
    elif api_key and (api_key.startswith("xai-") or "grok" in settings.LLM_MODEL.lower()):
        try:
            from openai import OpenAI

            client = OpenAI(
                api_key=api_key,
                base_url=settings.GROK_BASE_URL,
            )

            messages = [{"role": "system", "content": system_prompt}]
            if history:
                for msg in history:
                    role = "assistant" if msg["role"] == "model" else "user"
                    messages.append({"role": role, "content": msg["parts"][0]})

            user_content = f"Patient Query: {query}\n\nReport Context:\n{context_str}"
            messages.append({"role": "user", "content": user_content})

            model_name = settings.LLM_MODEL if "grok" in settings.LLM_MODEL.lower() else "grok-beta"

            completion = client.chat.completions.create(
                model=model_name,
                messages=messages,
                temperature=0.0,
                max_tokens=512,
            )
            return sanitize_llm_text(completion.choices[0].message.content)
        except Exception as e:
            return f"Grok AI encountered an error: {str(e)}. Please check your xAI API key in backend/.env."

    # 3. Try Google Gemini (if key starts with 'AIza')
    elif api_key and api_key.startswith("AIza"):
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=api_key)
            contents = []
            if history:
                for msg in history:
                    contents.append(
                        types.Content(role=msg["role"], parts=[types.Part(text=msg["parts"][0])])
                    )

            user_text = f"Patient Query: {query}\n\nReport Context:\n{context_str}"
            contents.append(
                types.Content(role="user", parts=[types.Part(text=user_text)])
            )

            response = client.models.generate_content(
                model=settings.LLM_MODEL if "gemini" in settings.LLM_MODEL.lower() else "gemini-1.5-pro",
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=0.0,
                    max_output_tokens=512,
                )
            )
            return sanitize_llm_text(response.text)
        except Exception as e:
            return f"Gemini AI encountered an error: {str(e)}. Please check your API key in backend/.env."

    # 4. Fallback if no key or key format unrecognized
    else:
        if context:
            return sanitize_llm_text(
                f"Based on your MedVisionAI screening report: {context_str}\n\n"
                f"For full AI conversation, please add a valid API key (Groq starting with 'gsk_', xAI starting with 'xai-', or Gemini starting with 'AIza') to backend/.env. "
                f"For all medical decisions, consult a qualified healthcare professional."
            )
        else:
            return (
                "No report context found for your account. Please ensure your doctor has generated and published your screening report. "
                "For medical decisions, please consult a qualified healthcare professional."
            )

