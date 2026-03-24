import pytest
from unittest.mock import patch, MagicMock
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app as flask_app

@pytest.fixture
def app():
    flask_app.config['TESTING'] = True
    yield flask_app

@pytest.fixture
def client(app):
    return app.test_client()

def test_health_check(client):
    response = client.get('/api/health')
    assert response.status_code == 200
    # Status may vary if connection fails, but basic check passes

@patch('app.elevenlabs_service')
def test_start_session(mock_service, client):
    mock_service.get_signed_url.return_value = 'http://mock-url'
    response = client.post('/api/start-session')
    assert response.status_code == 200
    assert response.json['signed_url'] == 'http://mock-url'

@patch('app.processing_service')
@patch('app.elevenlabs_service')
def test_process_transcript(mock_elevenlabs, mock_processing, client):
    # Mock transcript retrieval
    mock_elevenlabs.get_transcript.return_value = [
        {'role': 'agent', 'message': 'Hello'},
        {'role': 'user', 'message': 'Hi there'}
    ]
    
    mock_processing.process_full_transcript.return_value = 'Processed Summary'
    
    response = client.post('/api/process-transcript', json={'conversation_id': 'conv_123'})
    
    assert response.status_code == 200
    assert response.json['report'] == 'Processed Summary'
    assert response.json['full_transcript'] == 'Agent: Hello\nUser: Hi there'
    mock_processing.process_full_transcript.assert_called_with('Agent: Hello\nUser: Hi there')

