# OpenRouter.ai Setup Guide for Nomie

## What is OpenRouter?

[OpenRouter](https://openrouter.ai) is a unified API that provides access to multiple large language models (LLMs) from a single endpoint. Instead of managing separate API keys for Claude, GPT-4, Llama, Mistral, and other models, you can use one OpenRouter API key to access all of them.

**Key benefits:**
- Access to 100+ LLMs (Claude, GPT-4, Llama, Mistral, etc.)
- Unified API - single endpoint for all models
- Pay-as-you-go pricing with competitive rates
- Model fallbacks if primary model is unavailable
- Same prompt/response format across all models
- Transparent pricing and usage tracking

---

## Step 1: Create an OpenRouter Account

### Sign Up

1. Visit [openrouter.ai](https://openrouter.ai)
2. Click **"Sign in"** in the top right
3. Choose your sign-up method:
   - Email/Password
   - Google
   - GitHub
4. Complete the sign-up process

### Create an API Key

1. After signing in, click your **Profile** (top right)
2. Go to **API Keys** section
3. Click **"Create new key"**
4. Give it a name (e.g., "Nomie")
5. Copy the API key immediately - **you won't see it again**
6. Store it securely

**Important:** Never share your API key or commit it to version control!

---

## Step 2: Add OpenRouter to Nomie

### Enable AI Integration with OpenRouter

1. Open Nomie Settings
2. Navigate to **More Settings → AI Integration**
3. Enable **AI Features** toggle
4. In the service selector, choose **OpenRouter**
5. Paste your API key in the **API Key** field
6. **Strongly recommended**: Set a PIN in **More Settings → Security → Use PIN** to encrypt your API key
7. Click **Save Configuration**

**Success indicators:**
- ✅ "API key is encrypted with your PIN" message appears (if PIN is set)
- ✅ Service selector shows "Using openrouter"
- ✅ AI features (Insight widget, AI Chat) are now enabled

---

## Step 3: Understand Available Models

OpenRouter provides access to many models. Here's what you should know:

### Popular Models for Nomie

| Model | Provider | Speed | Cost | Best For |
|-------|----------|-------|------|----------|
| `openai/gpt-3.5-turbo` | OpenAI | Very Fast | Lowest | Budget-conscious, general use |
| `openai/gpt-4` | OpenAI | Medium | High | Complex analysis, better accuracy |
| `anthropic/claude-3.5-sonnet` | Anthropic | Medium | Medium | Best quality for insights |
| `anthropic/claude-3-opus` | Anthropic | Slower | High | Most capable Claude model |
| `meta-llama/llama-3-70b` | Meta | Fast | Low | Open-source alternative |
| `mistralai/mistral-large` | Mistral | Fast | Low | Balanced performance |

### Current Nomie Default

Nomie is configured with **`openai/gpt-3.5-turbo`** by default because:
- ✅ Lowest cost
- ✅ Very fast (good for real-time features)
- ✅ Reliable and stable
- ✅ Suitable for insight generation and chat

### How to Change Models

To use a different model:

1. Go to **Nomie Settings → AI Integration**
2. Your API key is stored and working
3. Contact support or check OpenRouter documentation for available models
4. Models can be configured via environment variables (see Advanced Configuration below)

---

## Pricing

### How OpenRouter Pricing Works

OpenRouter uses **pay-as-you-go** pricing:
- You pay for each API call based on tokens used
- No monthly subscription required
- Competitive rates (often lower than direct API providers)
- Transparent pricing displayed before use

### Estimated Costs for Nomie

**For typical Nomie usage:**

| Feature | Model | Avg Cost | Frequency |
|---------|-------|----------|-----------|
| Insight Widget | GPT-3.5 Turbo | $0.001-0.005 | 1-2x per day |
| AI Chat | GPT-3.5 Turbo | $0.002-0.010 | Per question |
| Daily Usage | GPT-3.5 Turbo | ~$0.10-0.30 | Full day |
| Monthly | GPT-3.5 Turbo | ~$3-10 | 30 days |

### Cost Optimization Tips

1. **Use GPT-3.5 Turbo** (default) for maximum savings
2. **Set reasonable context limits** - less data = fewer tokens = lower cost
3. **Cache your API responses** - Nomie caches insights per day automatically
4. **Monitor usage** - Check OpenRouter dashboard for spending patterns

### Free Trial

OpenRouter typically provides free credits for new accounts. Check your account dashboard for:
- Free trial period
- Available credits
- Usage statistics

---

## Advanced Configuration

### Environment Variables (Development)

If developing Nomie locally, you can set environment variables:

```bash
# .env.local
VITE_OPENROUTER_API_KEY=sk-or-...
VITE_OPENROUTER_MODEL=openai/gpt-3.5-turbo
```

### Checking Your Usage

1. Log in to [openrouter.ai](https://openrouter.ai)
2. Click **Account** → **Usage**
3. View:
   - Tokens used
   - Requests made
   - Cost breakdown by model
   - Daily/monthly limits

### Monitoring API Health

If Nomie's AI features aren't working:

1. **Check OpenRouter status**: [status.openrouter.ai](https://status.openrouter.ai)
2. **Verify your API key**:
   - Go to Settings → AI Integration
   - Ensure API key is still there (encrypted)
   - Try re-entering the key if issues persist
3. **Check account credits**:
   - Log in to openrouter.ai
   - Ensure you have available balance
   - Add payment method if needed
4. **Review error messages**:
   - Check browser console (F12) for specific errors
   - Common issues: invalid key, insufficient credits, rate limited

---

## Troubleshooting

### "API key is not configured"
- **Solution**: Go to Settings → AI Integration → add your API key and click Save

### "Failed to decrypt API key"
- **Cause**: You have a PIN set but Nomie can't decrypt the key
- **Solution**: 
  - Go to Settings → Security → change your PIN
  - Then go to AI Integration and re-enter your API key
  - Save again

### "OpenRouter API error"
- **Cause**: Invalid API key or account issue
- **Solution**:
  - Verify key at [openrouter.ai](https://openrouter.ai) → API Keys
  - Ensure you have available credits
  - Check OpenRouter status page for service issues

### Insight Widget Not Showing
- Ensure AI is enabled in Settings → AI Integration
- Check that OpenRouter is selected
- Verify API key is entered and PIN is set (if applicable)
- Wait for widget to load (caches for 24 hours)

### Chat Slow or Timing Out
- OpenRouter may be slow with certain models
- Try reducing the timeframe (less data = faster response)
- Check OpenRouter dashboard for rate limits
- Consider switching to GPT-3.5 Turbo for better speed

### High Unexpected Costs
- Review usage in OpenRouter dashboard
- Check which model is being used
- Consider using GPT-3.5 Turbo (cheaper)
- Set context limits to reduce token usage

---

## Switching Between Claude and OpenRouter

Nomie makes it easy to switch providers:

1. Go to **Settings → AI Integration**
2. Click the service selector (Claude / OpenRouter)
3. Choose your preferred provider
4. Ensure API key is entered for that provider
5. Click **Save Configuration**

**Note**: You must have API keys for any provider you want to use. Both can be configured simultaneously.

---

## Security Best Practices

1. **Always use a PIN**
   - Set PIN in Settings → Security → Use PIN
   - This encrypts your API key at rest
   - Required for decryption when AI features are used

2. **Regenerate your key if exposed**
   - Go to openrouter.ai → API Keys
   - Delete the old key
   - Create a new one
   - Update it in Nomie

3. **Monitor your account**
   - Check OpenRouter usage regularly
   - Set up alerts for unusual activity
   - Review connected applications

4. **Never share your key**
   - Don't paste it in public forums
   - Don't commit to version control
   - Don't share screenshots showing the key

---

## FAQ

### Can I use both Claude and OpenRouter?
Yes! You can configure API keys for both. Switch between them anytime in Settings → AI Integration.

### What if OpenRouter is down?
Switch to Claude in Settings → AI Integration. Or wait for OpenRouter to come back online.

### Can I use free tier of OpenRouter?
OpenRouter doesn't offer a free tier, but they often provide free trial credits for new accounts.

### How many tokens does an insight use?
- Summary insight: ~500-1000 tokens
- Extended insight: ~1000-1500 tokens
- Typical cost per insight: $0.001-0.005 with GPT-3.5 Turbo

### Can I change the model OpenRouter uses?
Currently, Nomie uses a default model. To use different models, contact support or check for future configuration options.

### Is my data shared with OpenRouter?
- Your API key: Only for authentication
- Your prompts and data: Sent to OpenRouter's servers to generate responses
- OpenRouter's privacy policy applies to data processing
- See [openrouter.ai/privacy](https://openrouter.ai/privacy) for details

### What happens to my insights if I switch providers?
Your existing cached insights are stored locally and won't be affected. New insights will be generated by whichever provider you have configured.

---

## Getting Help

### Nomie Support
- Check this guide first
- Review browser console (F12) for errors
- Check git issues or discussions

### OpenRouter Support
- [OpenRouter Documentation](https://openrouter.ai/docs)
- [OpenRouter Status Page](https://status.openrouter.ai)
- [OpenRouter Support Email](https://openrouter.ai)

### Report Issues
If you find a bug with OpenRouter integration in Nomie:
1. Include your error message
2. Include steps to reproduce
3. Include OpenRouter error response (if any)
4. Do NOT include your actual API key

---

## Next Steps

1. ✅ Create OpenRouter account and API key
2. ✅ Add API key to Nomie
3. ✅ Set a PIN to encrypt your key
4. ✅ Try Insight Widget on a tracker
5. ✅ Try AI Chat feature
6. ✅ Monitor costs in OpenRouter dashboard

Enjoy AI-powered insights in Nomie! 🚀
