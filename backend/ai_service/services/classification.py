import os
import requests
import logging
import time
from .classification_prompts import SYSTEM_PROMPT_REPORT_CLASSIFICATION, get_classification_prompt

class ClassificationService:
    def __init__(self, api_token):
        self.api_token = api_token
        # Using Hugging Face Inference API for classification
        self.chat_url = "https://router.huggingface.co/v1/chat/completions"
        self.default_model = "Qwen/Qwen2.5-72B-Instruct"
        
    def classify_report(self, report_text, employee_context=""):
        """
        Classify a completed handover report.
        
        Args:
            report_text (str): The complete handover report text
            employee_context (str): Additional context about employee role, department, etc.
            
        Returns:
            dict: Classification results with risk assessment and recommendations
        """
        if not report_text:
            raise ValueError("Report text cannot be empty")
            
        logging.info("Starting report classification...")
        
        # Generate the classification prompt
        prompt = get_classification_prompt(report_text, employee_context)
        
        # Prepare payload for Hugging Face API
        payload = {
            "model": self.default_model,
            "messages": [
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT_REPORT_CLASSIFICATION
                },
                {
                    "role": "user", 
                    "content": prompt
                }
            ],
            "max_tokens": 4000,
            "temperature": 0.2  # Lower temperature for more consistent classification
        }
        
        headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }
        
        try:
            logging.info(f"Sending classification request to Hugging Face API...")
            response = requests.post(self.chat_url, headers=headers, json=payload, timeout=120)
            response.raise_for_status()
            
            result = response.json()
            
            if "choices" in result and len(result["choices"]) > 0:
                classification_text = result["choices"][0]["message"]["content"]
                
                # Parse JSON response
                import json
                try:
                    classification_result = json.loads(classification_text)
                    logging.info("Successfully classified report")
                    return classification_result
                except json.JSONDecodeError as e:
                    logging.error(f"Failed to parse classification JSON: {e}")
                    # Return basic classification if JSON parsing fails
                    return self._create_fallback_classification(classification_text)
                    
            else:
                logging.warning(f"Unexpected response format: {result}")
                return self._create_error_classification("Unexpected API response format")
                
        except requests.exceptions.RequestException as e:
            logging.error(f"Error calling classification API: {e}")
            return self._create_error_classification(f"API request failed: {str(e)}")
        except Exception as e:
            logging.error(f"Unexpected error in classification: {e}")
            return self._create_error_classification(f"Classification failed: {str(e)}")
    
    def _create_fallback_classification(self, classification_text):
        """
        Create a basic classification structure when JSON parsing fails.
        """
        return {
            "report_metadata": {
                "employee_role": "Unknown",
                "department": "Unknown", 
                "total_knowledge_items": 0,
                "overall_risk_score": 0.5,
                "knowledge_coverage_score": 0.5
            },
            "classification_results": [],
            "risk_assessment": {
                "high_risk_items": [],
                "knowledge_gaps": []
            },
            "action_recommendations": {
                "immediate_actions": [],
                "knowledge_transfer_plan": []
            },
            "organizational_insights": {
                "knowledge_health": "AT_RISK",
                "documentation_maturity": "LOW",
                "succession_readiness": "FAIR",
                "key_recommendations": ["Review classification output", "Manual review required"]
            },
            "raw_classification": classification_text,
            "classification_status": "fallback"
        }
    
    def _create_error_classification(self, error_message):
        """
        Create an error classification structure.
        """
        return {
            "report_metadata": {
                "employee_role": "Unknown",
                "department": "Unknown",
                "total_knowledge_items": 0,
                "overall_risk_score": 0.8,  # High risk due to classification failure
                "knowledge_coverage_score": 0.0
            },
            "classification_results": [],
            "risk_assessment": {
                "high_risk_items": [
                    {
                        "topic": "Classification Failure",
                        "risk_description": "Unable to classify report automatically",
                        "mitigation_required": "Manual classification needed",
                        "impact_if_lost": "Unknown knowledge gaps"
                    }
                ],
                "knowledge_gaps": []
            },
            "action_recommendations": {
                "immediate_actions": [
                    {
                        "action": "Manual classification review",
                        "priority": "HIGH",
                        "deadline": "Immediately",
                        "responsible": "Knowledge Manager"
                    }
                ],
                "knowledge_transfer_plan": []
            },
            "organizational_insights": {
                "knowledge_health": "CRITICAL",
                "documentation_maturity": "UNKNOWN",
                "succession_readiness": "UNKNOWN",
                "key_recommendations": ["Fix classification system", "Manual review required"]
            },
            "error_message": error_message,
            "classification_status": "error"
        }
    
    def get_risk_summary(self, classification_result):
        """
        Extract a quick risk summary from classification results.
        """
        if not classification_result or "risk_assessment" not in classification_result:
            return "Unable to assess risk"
            
        high_risk_count = len(classification_result["risk_assessment"].get("high_risk_items", []))
        overall_risk = classification_result["report_metadata"].get("overall_risk_score", 0)
        
        if high_risk_count > 0 or overall_risk > 0.7:
            return f"HIGH RISK: {high_risk_count} critical items identified"
        elif overall_risk > 0.4:
            return f"MEDIUM RISK: Review recommended"
        else:
            return "LOW RISK: Standard procedures apply"
    
    def get_immediate_actions(self, classification_result):
        """
        Extract immediate action items from classification results.
        """
        if not classification_result or "action_recommendations" not in classification_result:
            return []
            
        return classification_result["action_recommendations"].get("immediate_actions", [])
