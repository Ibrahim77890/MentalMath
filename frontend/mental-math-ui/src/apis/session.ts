import axios from 'axios';

// General API response interface
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// Session data interface
export interface Session {
  id: string;
  topicOrder: string[];
  startTime: string;
  endTime: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
  questions: QuestionSession[];
}

// QuestionSession data interface
export interface QuestionSession {
  id: string;
  questionId: string;
  question: Question;
  response: string;
  correct: boolean;
  timeTaken: number;
  timestamp: string;
  attemptNumber?: number;
  agentFeedback?: any;
  strategyTip?: string;
  answerVariants?: string[];
  extraData?: any;
}

// Question data interface (from MongoDB)
export interface Question {
  _id: string;
  text: string;
  topic: string;
  difficulty: number;
  options?: { label: string; value: string }[];
  correctAnswer?: string;
  subtopic?: string;
  answerVariants?: string[];
  tags?: string[];
  mentalSkill?: string[];
  hints?: string[];
  strategyTip?: string;
  estimatedTime?: number;
  origin?: string;
  // ...add other fields as needed
}

// Response for current session question
export interface CurrentSessionQuestionResponse {
  session: Session;
  currentQuestionSession: QuestionSession;
  currentQuestion: Question;
}

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';

export class SessionAPI {
  static async currentSession(token: string): Promise<ApiResponse<Session>> {
    const response = await axios.get<ApiResponse<Session>>(`${API_BASE_URL}/sessions/current`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  static async createSession(
    topicOrder: string[],
    token: string
  ): Promise<ApiResponse<Session>> {
    const response = await axios.post<ApiResponse<Session>>(
      `${API_BASE_URL}/sessions`,
      { topicOrder },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  }

  static async getSession(sessionId: string, token: string): Promise<ApiResponse<Session>> {
    console.log("[getSession] called");
    
    const response = await axios.get<ApiResponse<Session>>(
      `${API_BASE_URL}/sessions/${sessionId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  }

  static async getSessionLatestQuestion(sessionId: string, token: string): Promise<ApiResponse<CurrentSessionQuestionResponse>> {
    console.log("[getSessionLatestQuestion] called");
    const response = await axios.get<ApiResponse<CurrentSessionQuestionResponse>>(
      `${API_BASE_URL}/sessions/current-session-question/${sessionId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  }

  static async postSessionLatestQuestionAnswer(
    sessionId: string,
    response: string,
    timeTaken: number,
    token: string
  ): Promise<ApiResponse<CurrentSessionQuestionResponse>> {
    const res = await axios.post<ApiResponse<CurrentSessionQuestionResponse>>(
      `${API_BASE_URL}/sessions/answer-current-session-question`,
      { sessionId, response, timeTaken },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  }

  static async fetchDashboardForTopic(
    topic: string,
    token: string
  ): Promise<ApiResponse<{ stats: any; recent: any[]; chart: any }>> {
    const res = await axios.get<ApiResponse<{ stats: any; recent: any[]; chart: any }>>(
      `${API_BASE_URL}/sessions/dashboard`,
      {
        params: { topic },
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return res.data;
  }
}