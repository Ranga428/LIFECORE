import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/supabase.js';
import { AuthRequest, authenticate } from '../middleware/auth.js';
import { generateStructured, streamText, generateText } from '../services/aiAdapter.js';

const router = Router();

const TRACKER_SYSTEM_PROMPT = `You are LifeCore's AI Tracker Generator. Your role is to analyze user's life goals and generate a personalized tracker configuration.

CONTEXT:
- LifeCore is an AI-powered life tracker app
- Users describe their goals in natural language
- You generate structured tracker configurations with sections

TASK:
Analyze the user's prompt and generate a tracker with relevant sections. Consider these category types:
- fitness: workout tracking, weight goals, exercise logs
- nutrition: meal tracking, calorie/macro goals, hydration
- finance: budget tracking, expense categories, savings goals
- schedule: calendar integration, event reminders, time blocking
- medicine: medication reminders, dosage tracking, health metrics
- wellness: mood tracking, sleep, meditation, habits
- productivity: task lists, goals, Pomodoro timers, focus sessions
- custom: any other tracking needs

OUTPUT FORMAT - Valid JSON only:
{
  "name": "Tracker Name based on goals",
  "sections": [
    {
      "type": "category type",
      "order_index": 0,
      "config": {
        "title": "Section Display Name",
        "goals": ["specific goals for this section"],
        "metrics": ["what to track"],
        "frequency": "daily/weekly/etc"
      }
    }
  ]
}

RULES:
- Generate 2-6 sections based on the user's needs
- Keep section titles meaningful and personal
- Always include actionable metrics
- Ensure valid JSON with no extra text`;

const WORKOUT_SYSTEM_PROMPT = `You are LifeCore's AI Workout Planner. Generate personalized workout plans based on user goals.

CONTEXT:
- User provides: goal (weight loss, muscle gain, etc.), duration, frequency, equipment available
- Generate week-by-week plans with specific exercises, sets, reps, rest periods
- Include progressive overload recommendations

OUTPUT - Valid JSON only:
{
  "weeks": [
    {
      "week": 1,
      "days": [
        {
          "day": "Monday",
          "focus": "Upper Body",
          "exercises": [
            { "name": "Exercise name", "sets": 3, "reps": "8-12", "rest": "60s" }
          ]
        }
      ]
    }
  ]
}`;

const FOOD_ANALYSIS_SYSTEM_PROMPT = `You are a nutrition expert. Analyze food items and estimate their nutritional content.

OUTPUT - Valid JSON only:
{
  "items": [
    {
      "name": "Food item",
      "estimated_calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "confidence": "high/medium/low"
    }
  ],
  "total": {
    "calories": number,
    "protein": number,
    "carbs": number,
    "fat": number
  }
}`;

const CHAT_SYSTEM_PROMPT = `You are LifeCore, an AI life assistant. You help users manage their health, productivity, finance, and wellness.

CAPABILITIES:
- Answer questions about their data
- Suggest tracker improvements
- Execute commands like "Add a hydration tracker"
- Provide insights and recommendations

Be helpful, concise, and friendly. When users ask to add/modify trackers, respond with a structured JSON command they can confirm.`;

interface TrackerConfig {
  name: string;
  sections: Array<{
    type: string;
    order_index: number;
    config: Record<string, unknown>;
  }>;
}

router.post('/generate-tracker', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { prompt } = z.object({ prompt: z.string().min(10) }).parse(req.body);

    const config = await generateStructured<TrackerConfig>(
      TRACKER_SYSTEM_PROMPT,
      `Generate a tracker for: ${prompt}`,
      { model: 'claude-3-5-sonnet-20241022', maxTokens: 4096 }
    );

    const trackerId = uuidv4();
    const { data: tracker, error: trackerError } = await supabase
      .from('trackers')
      .insert({
        id: trackerId,
        user_id: req.userId,
        name: config.name,
        prompt_used: prompt,
        config_json: config,
      })
      .select()
      .single();

    if (trackerError) throw trackerError;

    const sectionsToInsert = config.sections.map((section, index) => ({
      id: uuidv4(),
      tracker_id: trackerId,
      type: section.type,
      order_index: index,
      config_json: section.config,
    }));

    const { error: sectionsError } = await supabase.from('tracker_sections').insert(sectionsToInsert);
    if (sectionsError) throw sectionsError;

    const { data: fullTracker } = await supabase
      .from('trackers')
      .select('*, tracker_sections(*)')
      .eq('id', trackerId)
      .single();

    res.json({ tracker: fullTracker });
  } catch (err) {
    next(err);
  }
});

router.post('/generate-tracker/stream', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { prompt } = z.object({ prompt: z.string().min(10) }).parse(req.body);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let fullContent = '';
    
    await streamText(
      TRACKER_SYSTEM_PROMPT,
      `Generate a tracker for: ${prompt}`,
      (chunk) => {
        fullContent += chunk;
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }
    );

    try {
      const config = JSON.parse(fullContent) as TrackerConfig;
      
      const trackerId = uuidv4();
      await supabase.from('trackers').insert({
        id: trackerId,
        user_id: req.userId,
        name: config.name,
        prompt_used: prompt,
        config_json: config,
      });

      const sectionsToInsert = config.sections.map((section, index) => ({
        id: uuidv4(),
        tracker_id: trackerId,
        type: section.type,
        order_index: index,
        config_json: section.config,
      }));

      await supabase.from('tracker_sections').insert(sectionsToInsert);

      res.write(`data: ${JSON.stringify({ done: true, trackerId })}\n\n`);
    } catch (parseError) {
      res.write(`data: ${JSON.stringify({ error: 'Failed to parse tracker config' })}\n\n`);
    }

    res.end();
  } catch (err) {
    next(err);
  }
});

router.post('/generate-workout', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { prompt } = z.object({ prompt: z.string().min(10) }).parse(req.body);

    const plan = await generateStructured(
      WORKOUT_SYSTEM_PROMPT,
      prompt,
      { maxTokens: 8192 }
    );

    const workoutId = uuidv4();
    const { data: workout, error } = await supabase.from('workouts').insert({
      id: workoutId,
      user_id: req.userId,
      plan_json: plan,
      generated_prompt: prompt,
      week_number: 1,
      status: 'draft',
    }).select().single();

    if (error) throw error;

    res.json({ workout, plan });
  } catch (err) {
    next(err);
  }
});

router.post('/analyze-food', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { items } = z.object({ items: z.array(z.string()) }).parse(req.body);

    const result = await generateStructured(
      FOOD_ANALYSIS_SYSTEM_PROMPT,
      `Analyze these food items: ${items.join(', ')}`,
      { maxTokens: 2048 }
    );

    res.json({ analysis: result });
  } catch (err) {
    next(err);
  }
});

router.post('/chat', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { message, context } = z.object({
      message: z.string().min(1),
      context: z.record(z.string(), z.any()).optional(),
    }).parse(req.body);

    const userContext = context ? `\n\nUser's current data: ${JSON.stringify(context)}` : '';

    const response = await generateText(
      CHAT_SYSTEM_PROMPT,
      `${message}${userContext}`,
    );

    res.json({ response: response.content });
  } catch (err) {
    next(err);
  }
});

router.post('/financial-insights', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { entries } = z.object({ entries: z.array(z.object({
      category: z.string(),
      amount: z.number(),
      type: z.string(),
      date: z.string(),
    })) }).parse(req.body);

    const insightsPrompt = `Based on these finance entries, provide weekly insights and suggestions:
${JSON.stringify(entries, null, 2)}

Provide a JSON response:
{
  "summary": "brief summary",
  "insights": ["insight 1", "insight 2"],
  "suggestions": ["suggestion 1"]
}`;

    const insights = await generateStructured(
      insightsPrompt,
      '',
      { maxTokens: 1024 }
    );

    res.json({ insights });
  } catch (err) {
    next(err);
  }
});

export default router;