import { pipeline, type TextClassificationPipeline } from '@xenova/transformers';

// Singleton pipeline promise (loads model once per process)
let _classifierPromise: Promise<TextClassificationPipeline> | null = null;

function getClassifier() {
  if (!_classifierPromise) {
    // Model outputs: negative / neutral / positive
    _classifierPromise = pipeline(
      'sentiment-analysis',
      'Xenova/twitter-roberta-base-sentiment-latest'
    ) as Promise<TextClassificationPipeline>;
  }
  return _classifierPromise;
}

export type SentimentLabel = 'Good' | 'Neutral' | 'Bad';

export async function analyzeSentiment(text: string): Promise<{
  score: number;                // signed integer, ~[-10..10]
  label: SentimentLabel;        // Good | Neutral | Bad
  probs: Record<string, number>;// raw class probs for debugging
}> {
  const classifier = await getClassifier();

  // Ask for all classes so we can compute a signed score
  const result = await classifier(text, { topk: 3 }) as Array<{ label: string; score: number }>;
  // result is an array like: [{label:'positive', score:0.82}, {label:'neutral',...}, {label:'negative',...}]
  const probs: Record<string, number> = {};
  for (const r of result) probs[r.label.toLowerCase()] = r.score;

  const pos = probs['positive'] ?? 0;
  const neg = probs['negative'] ?? 0;
  const neu = probs['neutral']  ?? 0;

  // Primary label = argmax
  let primary = 'neutral';
  if (pos >= neg && pos >= neu) primary = 'positive';
  else if (neg >= pos && neg >= neu) primary = 'negative';

  // Map to your domain labels
  const label: SentimentLabel =
    primary === 'positive' ? 'Good' :
    primary === 'negative' ? 'Bad' : 'Neutral';

  // Signed score: positive confidence minus negative confidence, scaled to int
  const score = Math.round((pos - neg) * 10); // ~[-10..10]

  return { score, label, probs };
}

// Optional: warm-up on boot to avoid cold latency
export async function warmupSentiment() {
  await analyzeSentiment('ok'); // triggers model load & compilation
}
