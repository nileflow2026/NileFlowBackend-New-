# AI Chat Controller Implementation Guide

## Overview

This implementation provides a production-grade AI chat controller for the NileFlow eCommerce platform with OpenAI integration, user context awareness, and comprehensive error handling.

## Features Implemented

### ✅ Core Features

- **POST endpoint**: `/api/ai/chat` accepts `{ userId, message, sessionId }`
- **User Context**: Fetches user profile and last 5 orders from Appwrite
- **Intent Classification**: Automatically classifies queries into:
  - `PRODUCT_QUERY` - Product searches, recommendations, comparisons
  - `ORDER_STATUS` - Order tracking, delivery status, returns
  - `FAQ` - General help, policies, company information
  - `UNKNOWN` - Unclassified queries
- **Context Retrieval**: Dynamic context loading based on intent
- **OpenAI Integration**: GPT-3.5-turbo with structured prompts
- **Clean Response**: Returns `{ reply, intent, sessionId, metadata }`

### ✅ Production Features

- **Authentication**: Requires valid JWT tokens
- **Rate Limiting**: Prevents API abuse
- **Token Guards**: Limits input/output tokens for cost control
- **Error Handling**: Comprehensive error responses with codes
- **Logging**: Detailed logging for monitoring and debugging
- **Health Check**: Service health monitoring endpoint
- **Input Validation**: Sanitizes and validates all inputs

## Setup Instructions

### 1. Environment Variables

Add to your `.env` file:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here

# Optional: AI Chat specific settings
AI_CHAT_MAX_INPUT_TOKENS=3000
AI_CHAT_MAX_OUTPUT_TOKENS=1000
AI_CHAT_MODEL=gpt-3.5-turbo
```

### 2. Required Collections

Ensure these Appwrite collections exist (optional for enhanced context):

- Products Collection: `APPWRITE_PRODUCT_COLLECTION_ID`
- Categories Collection: `APPWRITE_CATEGORIES_COLLECTION_ID`
- Orders Collection: `APPWRITE_ORDERS_COLLECTION` (required)

### 3. Start the Server

```bash
npm run dev
```

## API Endpoints

### POST /api/ai/chat

**Description**: Main AI chat endpoint

**Headers**:

```json
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json"
}
```

**Request Body**:

```json
{
  "userId": "user_12345",
  "message": "What's the status of my latest order?",
  "sessionId": "session_abc123" // optional
}
```

**Response**:

```json
{
  "reply": "Your latest order (#ORD12345) is currently being processed and will be shipped within 24 hours. You'll receive a tracking number once it's dispatched.",
  "intent": "ORDER_STATUS",
  "sessionId": "session_abc123",
  "metadata": {
    "responseTime": "1250ms",
    "tokensUsed": 245,
    "model": "gpt-3.5-turbo"
  }
}
```

### GET /api/ai/health

**Description**: Health check for AI chat service

**Response**:

```json
{
  "status": "healthy",
  "services": {
    "openai": "connected",
    "appwrite": "connected"
  },
  "timestamp": "2024-12-30T10:30:00.000Z"
}
```

## Error Responses

### Authentication Error (401)

```json
{
  "error": "Access token required",
  "code": "UNAUTHORIZED"
}
```

### Validation Error (400)

```json
{
  "error": "userId and message are required",
  "code": "MISSING_REQUIRED_FIELDS"
}
```

### Rate Limit Error (429)

```json
{
  "error": "Too many requests. Please try again later",
  "code": "RATE_LIMITED"
}
```

### Service Error (500)

```json
{
  "error": "Unable to process your request. Please try again",
  "code": "INTERNAL_ERROR",
  "metadata": {
    "responseTime": "500ms"
  }
}
```

## Usage Examples

### Product Query

```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "message": "I need a laptop for programming under $1000",
    "sessionId": "session_001"
  }'
```

### Order Status Query

```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "message": "Where is my order?",
    "sessionId": "session_001"
  }'
```

### FAQ Query

```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "message": "What is your return policy?",
    "sessionId": "session_001"
  }'
```

## Testing the Implementation

### 1. Health Check Test

```bash
curl http://localhost:3000/api/ai/health
```

### 2. Authentication Test

```bash
# Should return 401
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"userId": "test", "message": "hello"}'
```

### 3. Validation Test

```bash
# Should return 400
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "hello"}'
```

## Monitoring and Maintenance

### Key Metrics to Monitor

- Response times (target: <2 seconds)
- Token usage (input + output)
- Error rates by type
- Intent classification accuracy
- API costs

### Log Analysis

```bash
# Filter AI chat logs
grep "AI Chat" logs/app.log

# Monitor errors
grep "AI Chat error" logs/app.log

# Check response times
grep "responseTime" logs/app.log
```

### Cost Management

- Monitor token usage in logs
- Set up alerts for high usage
- Consider caching for FAQ responses
- Implement user-based rate limits

## Customization Options

### 1. Extend Intent Classification

Add new intents in the `INTENT_KEYWORDS` object:

```javascript
const INTENT_KEYWORDS = {
  PRODUCT_QUERY: [...],
  ORDER_STATUS: [...],
  FAQ: [...],
  CUSTOMER_SUPPORT: ['support', 'help', 'issue', 'problem'],
  RECOMMENDATIONS: ['recommend', 'suggest', 'similar', 'alternatives']
};
```

### 2. Enhanced Context Retrieval

Modify `getRelevantContext()` to:

- Integrate with search engines
- Add user behavior data
- Include purchase history
- Add product recommendations

### 3. Custom Prompts

Update `constructPrompt()` for:

- Brand-specific language
- Multilingual support
- Personalized responses
- Domain-specific knowledge

## Security Considerations

- ✅ JWT authentication required
- ✅ Input sanitization implemented
- ✅ Rate limiting applied
- ✅ Error message sanitization
- ✅ Token usage limits
- ✅ Request size validation

## Performance Optimization

### Current Optimizations

- Limited context retrieval (3 items max)
- Token usage monitoring
- Response caching possibilities
- Efficient database queries

### Future Enhancements

- Response caching for FAQs
- User session management
- Conversation history
- Advanced context retrieval
- Multi-language support

## Troubleshooting

### Common Issues

1. **OpenAI API Key Error**

   - Verify `OPENAI_API_KEY` in .env
   - Check API key validity
   - Ensure sufficient credits

2. **Appwrite Connection Issues**

   - Verify Appwrite configuration
   - Check collection permissions
   - Ensure database connectivity

3. **High Response Times**

   - Monitor token usage
   - Check context retrieval performance
   - Consider response caching

4. **Authentication Failures**
   - Verify JWT token format
   - Check middleware configuration
   - Ensure user exists in system

Ready to use! The AI chat controller is fully integrated and production-ready. 🚀
