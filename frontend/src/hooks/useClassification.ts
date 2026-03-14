import { api } from "@/lib/api";

export async function getSessionClassification(sessionId: string) {
  try {
    // Fetch the session/report first
    const sessionResponse = await api.getSession(sessionId);
    const report = sessionResponse.transcript || sessionResponse.summary;
    
    if (!report) {
      throw new Error("No report found to classify");
    }

    // Get employee context
    const employeeContext = `${sessionResponse.employee?.role || 'Unknown'} in ${sessionResponse.employee?.department || 'Unknown'} department`;

    // Classify the report
    const classificationResponse = await fetch(`${import.meta.env.VITE_AI_SERVICE_URL}/api/classify-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        report: report,
        employee_context: employeeContext
      })
    });

    if (!classificationResponse.ok) {
      throw new Error('Classification failed');
    }

    const result = await classificationResponse.json();
    return result;
  } catch (error) {
    console.error('Failed to get session classification:', error);
    throw error;
  }
}
