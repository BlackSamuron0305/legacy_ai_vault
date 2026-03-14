from flask import Flask, request, jsonify
from dotenv import load_dotenv
import os
import logging
from services.elevenlabs import ElevenLabsService
from services.processing import ProcessingService
from services.classification import ClassificationService

# Load environment from root .env (two levels up from this file)
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))

app = Flask(__name__)
log_level = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, log_level, logging.INFO),
    format="%(asctime)s [%(levelname)s] [ai-service] %(message)s"
)

@app.before_request
def log_request_start():
    payload = request.get_json(silent=True) if request.method in ["POST", "PUT", "PATCH"] else None
    logging.info(
        "Incoming request method=%s path=%s payload_keys=%s",
        request.method,
        request.path,
        list(payload.keys()) if isinstance(payload, dict) else []
    )

@app.after_request
def log_request_end(response):
    logging.info(
        "Completed request method=%s path=%s status=%s",
        request.method,
        request.path,
        response.status_code
    )
    return response

# Initialize services
elevenlabs_api_key = os.getenv("ELEVENLABS_API_KEY")
if not elevenlabs_api_key:
    logging.warning("ELEVENLABS_API_KEY is not set.")

huggingface_api_token = os.getenv("HUGGINGFACE_API_TOKEN")

# Initialize ElevenLabs with dynamic agent retrieval
elevenlabs_service = None
if elevenlabs_api_key:
    try:
        elevenlabs_service = ElevenLabsService(elevenlabs_api_key)
        logging.info("Initialized ElevenLabs service")
    except Exception as e:
        logging.error("Failed to initialize ElevenLabs service: %s", e)

processing_service = ProcessingService(huggingface_api_token)
classification_service = ClassificationService(huggingface_api_token)

@app.route('/api/health', methods=['GET'])
def health_check():
    status = "ok"
    if not elevenlabs_service:
        status = "degraded (elevenlabs missing)"
    return jsonify({"status": status, "service": "ai-service"}), 200

@app.route('/api/elevenlabs/voices', methods=['GET'])
def get_voices():
    """
    Get all available ElevenLabs voices.
    """
    if not elevenlabs_service:
        return jsonify({"error": "ElevenLabs service not configured"}), 503
    try:
        voices = elevenlabs_service.client.get_voices()
        return jsonify({"voices": voices}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/elevenlabs/models', methods=['GET'])
def get_models():
    """
    Get all available ElevenLabs models.
    """
    if not elevenlabs_service:
        return jsonify({"error": "ElevenLabs service not configured"}), 503
    try:
        models = elevenlabs_service.client.get_models()
        return jsonify({"models": models}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/start-session', methods=['POST'])
def start_session():
    """
    Start a new ElevenLabs conversation session using the dynamically retrieved agent.
    Returns a signed URL for the frontend to connect.
    """
    if not elevenlabs_service:
        logging.warning("start-session requested but ElevenLabs service not configured")
        return jsonify({"error": "ElevenLabs service not configured"}), 503
        
    try:
        url = elevenlabs_service.get_signed_url()
        logging.info("Generated ElevenLabs signed URL successfully")
        return jsonify({"signed_url": url}), 200
    except Exception as e:
        logging.exception("Failed to generate ElevenLabs signed URL")
        return jsonify({"error": str(e)}), 500

@app.route('/api/process-transcript', methods=['POST'])
def process_transcript():
    """
    Process a transcript from a conversation.
    Input: {"transcript": "text..."} or {"conversation_id": "xyz"}
    Output: {"processed": [chunks], "summary": "..."}
    """
    data = request.json
    transcript = data.get("transcript")
    conversation_id = data.get("conversation_id")

    logging.info(
        "process-transcript called has_transcript=%s transcript_length=%s conversation_id=%s",
        bool(transcript),
        len(transcript) if transcript else 0,
        conversation_id
    )

    if not transcript and not conversation_id:
        return jsonify({"error": "Missing 'transcript' or 'conversation_id'"}), 400

    if conversation_id:
        if not elevenlabs_service:
             logging.warning("process-transcript with conversation_id but ElevenLabs service unavailable")
             return jsonify({"error": "ElevenLabs service not configured"}), 503
        try:
            transcript_data = elevenlabs_service.get_transcript(conversation_id)
            if isinstance(transcript_data, list):
                # Format transcript with roles for better processing
                # ElevenLabs API returns 'role' ("user" or "agent") and 'message'
                formatted_lines = []
                for turn in transcript_data:
                    role = turn.get("role", "unknown").capitalize()
                    message = turn.get("message") or turn.get("text", "")
                    if message:
                        formatted_lines.append(f"{role}: {message}")
                
                transcript = "\n".join(formatted_lines)
                logging.info(
                    "Fetched and formatted transcript from ElevenLabs conversation_id=%s turns=%s length=%s",
                    conversation_id,
                    len(transcript_data),
                    len(transcript)
                )
            else:
                logging.warning(f"Unexpected transcript format: {type(transcript_data)}")
                
        except Exception as e:
            logging.exception("Failed to retrieve transcript from ElevenLabs conversation_id=%s", conversation_id)
            return jsonify({"error": f"Failed to retrieve transcript: {str(e)}"}), 500

    try:
        # Utilize the new comprehensive processing pipeline
        # This handles cleaning, smart chunking with overlap, and multi-step summarization
        logging.info("Starting transcript processing pipeline length=%s", len(transcript) if transcript else 0)
        final_report = processing_service.process_full_transcript(transcript)
        logging.info("Transcript processing pipeline completed report_length=%s", len(final_report) if final_report else 0)
        
        return jsonify({
            "status": "success",
            "full_transcript": transcript,
            "original_length": len(transcript),
            "report": final_report
        }), 200
    except Exception as e:
        logging.exception("Transcript processing failed")
        return jsonify({"error": f"Processing failed: {str(e)}"}), 500

@app.route('/api/classify-report', methods=['POST'])
def classify_report():
    """
    Classify a completed handover report for risk assessment and organizational intelligence.
    
    Input: {
        "report": "Complete handover report text",
        "employee_context": "Optional context about role, department, etc."
    }
    
    Output: {
        "classification_results": {...},
        "risk_assessment": {...},
        "action_recommendations": {...},
        "organizational_insights": {...}
    }
    """
    data = request.json
    report_text = data.get("report")
    employee_context = data.get("employee_context", "")

    logging.info(
        "classify-report called report_length=%s context_length=%s",
        len(report_text) if report_text else 0,
        len(employee_context) if employee_context else 0,
    )
    
    if not report_text:
        return jsonify({"error": "Missing 'report' field in request"}), 400
    
    try:
        # Use the classification service to analyze the report
        classification_result = classification_service.classify_report(report_text, employee_context)
        logging.info("Report classification completed")
        
        return jsonify({
            "status": "success",
            "classification": classification_result,
            "risk_summary": classification_service.get_risk_summary(classification_result),
            "immediate_actions": classification_service.get_immediate_actions(classification_result)
        }), 200
        
    except Exception as e:
        logging.exception("Classification failed")
        return jsonify({"error": f"Classification failed: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
