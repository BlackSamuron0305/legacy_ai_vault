import requests
import re
import logging
from services.report_prompts import SYSTEM_PROMPT_CHUNK_ANALYSIS, get_chunk_prompt

class ProcessingService:
    def __init__(self, api_token):
        self.api_token = api_token
        # Using Hugging Face Inference API (Serverless) via the router endpoint
        self.base_url = "https://router.huggingface.co/hf-inference/models" 
        # Switching to Qwen/Qwen2.5-72B-Instruct or similar strong instruction model for processing text
        self.chat_url = "https://router.huggingface.co/v1/chat/completions"
        self.default_model = "Qwen/Qwen2.5-72B-Instruct" 

    def clean_transcript(self, transcript):
        """
        Cleans the transcript by removing non-speech artifacts, filler words, etc.
        """
        if not transcript:
            return ""

        # Basic cleaning (regex based)
        _cleaned_text = re.sub(r'\[.*?\]', '', transcript) # Remove [Music], [Laughter] etc.
        # Preserve newlines for structure, just clean up extra spaces within lines
        cleaned_lines = [line.strip() for line in transcript.split('\n') if line.strip()]
        return '\n'.join(cleaned_lines)

    def format_transcript(self, transcript):
        """
        Formats the transcript (e.g. capitalizing first letters, adding punctuation).
        This can be done using a model or basic rules. Using simple rules for now.
        For advanced formatting, one could use a punctuation restoration model.
        """
        # Since we trust ElevenLabs/Whisper output mostly, we just return it or minor formatting
        if not transcript:
            return ""
        return transcript

    def split_transcript_smartly(self, transcript, chunk_size=8000, overlap_size=1200):
        """
        Splits a transcript into chunks with overlap, ensuring splits occur at line breaks (Agent/User turns).
        prevents infinite loops by force-adding lines if a single line exceeds capacity after split.
        
        Args:
            transcript (str): The full text.
            chunk_size (int): Target characters per chunk.
            overlap_size (int): Characters to overlap from previous chunk.
            
        Returns:
            list[str]: List of transcript chunks.
        """
        if not transcript:
            return []

        logging.info(
            "split_transcript_smartly called transcript_length=%s chunk_size=%s overlap_size=%s",
            len(transcript),
            chunk_size,
            overlap_size,
        )
            
        lines = transcript.split('\n')
        chunks = []
        current_chunk = []
        current_length = 0
        
        # Helper to rebuild text from lines
        def get_text(line_list):
            return '\n'.join(line_list)
            
        # If total length is small, return as single chunk
        if len(transcript) <= chunk_size:
            return [transcript]

        i = 0
        last_split_index = -1  # To detect infinite loops

        while i < len(lines):
            line = lines[i]
            line_len = len(line) + 1 # +1 for newline
            
            # If adding this line exceeds chunk size AND we have content
            if current_length + line_len > chunk_size and current_chunk:
                
                # INFINITE LOOP PREVENTION:
                # If we just split at this exact index and came back, it means 
                # the overlap + the current line is STILL too big.
                # In this case, we must consume the line to progress.
                if last_split_index == i:
                    current_chunk.append(line)
                    current_length += line_len
                    i += 1
                    continue

                chunks.append(get_text(current_chunk))
                last_split_index = i
                
                # Calculate start index for next chunk based on overlap
                # We want to keep the last N characters roughly
                overlap_buffer = []
                overlap_len = 0
                
                # Go backwards from current chunk end
                for processed_line in reversed(current_chunk):
                    if overlap_len < overlap_size:
                        overlap_buffer.insert(0, processed_line)
                        overlap_len += len(processed_line) + 1
                    else:
                        break
                        
                current_chunk = list(overlap_buffer)
                current_length = overlap_len
                
                # Don't increment i here, we retry processing 'lines[i]' with the new chunk
                continue
                
            current_chunk.append(line)
            current_length += line_len
            i += 1
            
        if current_chunk:
            chunks.append(get_text(current_chunk))

        logging.info("Transcript split complete chunk_count=%s", len(chunks))
            
        return chunks

    def process_with_model(self, text, model_name=None):
        """
        Processes a single chunk of text.
        Use process_full_transcript for handling long files.
        """
        model = model_name or self.default_model
        logging.debug("process_with_model called model=%s text_length=%s", model, len(text) if text else 0)
        
        # Use generic prompt if not specified (legacy support)
        # But ideally we use the specific chunk prompt
        system_content = SYSTEM_PROMPT_CHUNK_ANALYSIS
        user_content = text # The caller should format this with get_chunk_prompt if needed

        payload = {
            "model": model, 
            "messages": [
                {
                    "role": "user", 
                    "content": f"{system_content}\n\n{user_content}"
                }
            ],
            "max_tokens": 2000, 
            "temperature": 0.2 
        }
        
        url = self.chat_url
        headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }

        try:
            logging.info(f"Sending request to Hugging Face Router: {url}")
            response = requests.post(url, headers=headers, json=payload, timeout=90)
            response.raise_for_status()
            
            result = response.json()
            if "choices" in result and len(result["choices"]) > 0:
                  content = result["choices"][0]["message"]["content"]
                  logging.info("Model response received content_length=%s", len(content) if content else 0)
                  return content
            else: 
                 logging.warning(f"Unexpected response format: {result}")
                 return ""

        except Exception as e:
            logging.error(f"Error processing chunk: {str(e)}")
            raise

    def process_full_transcript(self, transcript_text):
        """
        Orchestrates the full processing pipeline:
        1. Split into chunks with overlap
        2. Process each chunk
        3. (Optional) Consolidate - for now returns list of analyses
        """
        # 1. Clean
        clean_text = self.clean_transcript(transcript_text)
        
        # 2. Split
        chunks = self.split_transcript_smartly(clean_text)
        logging.info(f"Split transcript into {len(chunks)} chunks.")
        
        results = []
        
        # 3. Process each chunk
        for idx, chunk in enumerate(chunks):
            logging.info(f"Processing chunk {idx+1}/{len(chunks)}...")
            logging.debug("Chunk metadata index=%s length=%s", idx + 1, len(chunk))
            prompt_text = get_chunk_prompt(chunk, idx, len(chunks))

            # Calling the method
            analysis = self.process_with_model(prompt_text)
            results.append(f"## Section {idx+1} Analysis\n\n{analysis}")
            
        return "\n\n---\n\n".join(results)
