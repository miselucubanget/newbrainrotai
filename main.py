from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from fastapi.responses import StreamingResponse
import io
import os
import requests
import json
import time
from dotenv import load_dotenv
from typing import Optional, Dict, Any

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load API keys from environment
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
REPLICATE_API_TOKEN = os.getenv("REPLICATE_API_TOKEN")

@app.get("/proxy-image")
def proxy_image(url: str):
    try:
        # ✅ Call requests.get() and assign to a variable
        resp = requests.get(url, stream=True, timeout=30)
        
        if resp.status_code == 200:
            content_type = resp.headers.get('content-type', 'image/jpeg')
            return StreamingResponse(
                io.BytesIO(resp.content),
                media_type=content_type
            )
        else:
            return {"error": f"Failed to fetch image: {resp.status_code}"}
    except Exception as e:
        return {"error": str(e)}

@app.get("/models")
def get_models():
    """Fetch available models from Groq API"""
    response = requests.get(
        "https://api.groq.com/openai/v1/models",
        headers={
            "Authorization": f"Bearer {GROQ_API_KEY}"
        }
    )
    return response.json()

class Prompt(BaseModel):
    text: str

class StoryResponse(BaseModel):
    brainrot: str
    translation: str
    image_prompt: str
    image_url: Optional[str] = None
    error: Optional[str] = None

def generate_image_pollinations(prompt: str) -> Optional[str]:
    """
    Generate an image using Pollinations.ai with correct endpoints
    """
    try:
        import urllib.parse
        
        # Clean prompt
        clean_prompt = prompt[:200] if len(prompt) > 200 else prompt
        clean_prompt = clean_prompt.replace('\n', ' ').replace('\r', ' ')
        encoded_prompt = urllib.parse.quote(clean_prompt)
        
        # CORRECT Pollinations endpoints:
        endpoints = [
            # Option 1: Direct image URL (returns raw image, not HTML)
            f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=1024&nologo=true",
            
            # Option 2: With explicit model parameter
            f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=1024&nologo=true&model=flux",
            
            # Option 3: Alternative format with seed for variety
            f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=1024&seed={hash(prompt) % 1000000}",
        ]
        
        print(f"🎨 Trying Pollinations with prompt: {clean_prompt[:60]}...")
        
        # Return the first endpoint (they should return raw images)
        return endpoints[0]
        
    except Exception as e:
        print(f"❌ Pollinations image generation failed: {str(e)}")
        return None


def parse_ai_response(raw_response: str) -> Dict[str, str]:
    """
    Parse the JSON response from Groq into structured data
    
    Args:
        raw_response: Raw string response from the AI
    
    Returns:
        Dictionary with brainrot, translation, and image_prompt keys
    """
    try:
        # Try to parse the response as JSON
        # First, try to find JSON within the response (in case AI adds extra text)
        start_idx = raw_response.find('{')
        end_idx = raw_response.rfind('}') + 1
        
        if start_idx != -1 and end_idx != 0:
            json_str = raw_response[start_idx:end_idx]
            parsed = json.loads(json_str)
            
            # Validate required fields
            return {
                "brainrot": parsed.get("brainrot", ""),
                "translation": parsed.get("translation", ""),
                "image_prompt": parsed.get("image_prompt", "")
            }
        else:
            # If no JSON found, return error structure
            return {
                "brainrot": raw_response,
                "translation": "Translation not available",
                "image_prompt": "chaotic colorful abstract digital art with meme aesthetics"
            }
            
    except json.JSONDecodeError as e:
        print(f"⚠️ JSON parsing error: {e}")
        # Fallback: return raw response with default values
        return {
            "brainrot": raw_response,
            "translation": "Could not parse structured response",
            "image_prompt": "abstract chaotic meme aesthetic"
        }

@app.post("/generate")
def generate_story(prompt: Prompt):
    """
    Generate chaotic Gen Z brainrot with tangents and absurd spirals
    """
    if not GROQ_API_KEY:
        return {"error": "API key missing. Add GROQ_API_KEY to your .env file."}

    try:
        import random
        random_seed = random.randint(1, 1000000)
        
        # SIMPLIFIED SYSTEM PROMPT THAT ACTUALLY WORKS
        system_prompt = """You are a Gen Z poster with severe brainrot. Transform the user's prompt into chaotic, lowercase-only brainrot content.

CRITICAL: You MUST respond with ONLY valid JSON in this exact format:
{"brainrot": "your chaotic post here", "translation": "normal english version here", "image_prompt": "surreal visual description here"}

RULES FOR BRAINROT:
- ALL lowercase, NO capitalization anywhere
- Maximum 3 emojis total
- Minimum 150 words across 3-4 paragraphs
- Include one random tangent that goes off-topic for 2 sentences then returns
- Start with something sensory and specific
- End with a deadpan philosophical observation

RULES FOR TRANSLATION:
- Normal, grammatically correct English
- Neutral tone, like explaining to HR

RULES FOR IMAGE PROMPT:
- Specific colors, lighting, composition
- Liminal, unsettling, surreal
- David Lynch meets corrupted 90s clipart aesthetic

Transform this prompt into brainrot: """

        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {
                        "role": "system",
                        "content": system_prompt
                    },
                    {
                        "role": "user",
                        "content": prompt.text
                    }
                ],
                "temperature": 0.9,
                "max_tokens": 2000,
                "top_p": 0.95,
                "frequency_penalty": 0.7,
                "presence_penalty": 0.7,
                "seed": random_seed,
                "response_format": {"type": "json_object"}
            },
            timeout=60
        )

        if response.status_code != 200:
            print(f"❌ Groq API error: {response.status_code}")
            print(f"Response: {response.text}")
            return f"error: API returned {response.status_code}"

        data = response.json()

        if "choices" not in data or not data["choices"]:
            print(f"❌ No choices in response: {data}")
            return "error: no response from AI"

        ai_response = data["choices"][0]["message"]["content"]
        print(f"📝 Raw AI response length: {len(ai_response)}")
        print(f"📝 First 200 chars: {ai_response[:200]}...")
        
        # ✅ PARSE THE RESPONSE - THIS WAS MISSING!
        try:
            parsed_data = json.loads(ai_response)
            brainrot_text = parsed_data.get("brainrot", ai_response)
            translation_text = parsed_data.get("translation", "")
            image_prompt_text = parsed_data.get("image_prompt", "")
        except json.JSONDecodeError:
            # If not valid JSON, try to extract JSON from the text
            import re
            json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
            if json_match:
                try:
                    parsed_data = json.loads(json_match.group())
                    brainrot_text = parsed_data.get("brainrot", ai_response)
                    translation_text = parsed_data.get("translation", "")
                    image_prompt_text = parsed_data.get("image_prompt", "")
                except:
                    brainrot_text = ai_response
                    translation_text = "Could not parse translation"
                    image_prompt_text = "surreal chaotic abstract digital art glitch aesthetic"
            else:
                brainrot_text = ai_response
                translation_text = "Could not parse translation"
                image_prompt_text = "surreal chaotic abstract digital art glitch aesthetic"
        
        # ✅ NOW parsed_data IS DEFINED!
        
        # Generate image
        image_url = None
        if image_prompt_text and len(image_prompt_text) > 10:
            print(f"🎨 Generating image with prompt: {image_prompt_text[:100]}...")
            enhanced_prompt = f"{image_prompt_text}, high quality, detailed, artistic, 8k, surreal liminal aesthetic"
            image_url = generate_image_pollinations(enhanced_prompt)
            if image_url:
                print(f"✅ Image URL generated")
            else:
                print("⚠️ Image generation failed")
        
        # ✅ RETURN JSON OBJECT
        return {
            "brainrot": brainrot_text,
            "translation": translation_text,
            "image_prompt": image_prompt_text,
            "image_url": image_url
        }

    except requests.exceptions.Timeout:
        return {"error": "Request timed out"}
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {str(e)}")
        return {"error": f"Network issue: {str(e)}"}
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"error": f"Something broke: {str(e)}"}
    
    
def retry_with_simple_prompt(user_prompt: str, api_key: str) -> str:
    """Fallback function if the main prompt fails"""
    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {
                        "role": "system",
                        "content": "Write a long, chaotic, lowercase-only Gen Z style post about the user's topic. Include tangents and absurd humor. Minimum 150 words."
                    },
                    {
                        "role": "user",
                        "content": user_prompt
                    }
                ],
                "temperature": 0.8,
                "max_tokens": 1500,
            },
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            return data["choices"][0]["message"]["content"]
        else:
            return "the chaos escaped... 💀"
            
    except Exception as e:
        print(f"Fallback also failed: {e}")
        return "the chaos escaped... 💀"
    

@app.get("/health")
def health_check():
    """Check if all services are configured properly"""
    return {
        "status": "healthy",
        "groq_configured": bool(GROQ_API_KEY),
        "replicate_configured": bool(REPLICATE_API_TOKEN),
        "python_version": "3.14+ compatible (using REST API)"
    }




# Mount static files (keep your existing structure)
app.mount("/", StaticFiles(directory="static", html=True), name="static")


