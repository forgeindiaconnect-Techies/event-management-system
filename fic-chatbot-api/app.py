from pathlib import Path

import torch
from fastapi import Body, FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer


BASE_MODEL_NAME = "HuggingFaceTB/SmolLM2-360M-Instruct"
ADAPTER_PATH = Path(__file__).parent / "fic-backrooms-final"

app = FastAPI(title="FIC BackRooms Chatbot API")

device = "cuda" if torch.cuda.is_available() else "cpu"


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1000)
    role: str | None = None
    portalId: int | None = None
    eventId: int | None = None


class ChatResponse(BaseModel):
    answer: str


tokenizer = AutoTokenizer.from_pretrained(str(ADAPTER_PATH))

if tokenizer.pad_token is None:
    tokenizer.pad_token = tokenizer.eos_token

base_model = AutoModelForCausalLM.from_pretrained(
    BASE_MODEL_NAME,
    torch_dtype=torch.float16 if device == "cuda" else torch.float32,
)

model = PeftModel.from_pretrained(
    base_model,
    str(ADAPTER_PATH),
)

model.to(device)
model.eval()


@app.get("/health")
def health():
    return {
        "status": "running",
        "device": device,
        "model": BASE_MODEL_NAME,
    }


@app.post("/chat", response_model=ChatResponse)
def chat(
    request: ChatRequest | None = Body(default=None),
    message: str | None = Query(default=None),
    role: str | None = Query(default=None),
    portalId: int | None = Query(default=None),
    eventId: int | None = Query(default=None),
):
    question = (
        request.message if request is not None else message
    )

    if question is None or not question.strip():
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty",
        )

    question = question.strip()
    active_role = request.role if request is not None else role
    active_portal_id = request.portalId if request is not None else portalId
    active_event_id = request.eventId if request is not None else eventId

    context = (
        f"Current user role: {active_role or 'UNKNOWN'}. "
        f"Current portal ID: {active_portal_id or 'not selected'}. "
        f"Current event ID: {active_event_id or 'not selected'}."
    )

    messages = [
        {
            "role": "system",
            "content": (
                "You are the official FIC BackRooms support assistant. "
                "Answer only questions about the FIC BackRooms platform. "
                "Be concise, clear and helpful. "
                "Respect the user's role permissions. "
                "Do not invent features, prices, policies or private data. "
                "If you do not know an answer, ask the user to contact support. "
                + context
            ),
        },
        {
            "role": "user",
            "content": question,
        },
    ]

    try:
        inputs = tokenizer.apply_chat_template(
            messages,
            tokenize=True,
            add_generation_prompt=True,
            return_dict=True,
            return_tensors="pt",
        )

        inputs = {
            key: value.to(device)
            for key, value in inputs.items()
        }

        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=150,
                do_sample=False,
                repetition_penalty=1.1,
                pad_token_id=tokenizer.eos_token_id,
                eos_token_id=tokenizer.eos_token_id,
            )

        prompt_length = inputs["input_ids"].shape[1]

        answer = tokenizer.decode(
            outputs[0][prompt_length:],
            skip_special_tokens=True,
        ).strip()

        if not answer:
            answer = (
                "I couldn't resolve this automatically. "
                "Please use Help and contact support."
            )

        return ChatResponse(answer=answer)

    except Exception as error:
        print(f"Chatbot generation error: {error}")

        raise HTTPException(
            status_code=500,
            detail="The chatbot could not generate a response",
        ) from error
